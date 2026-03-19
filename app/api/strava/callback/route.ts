import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import {
  buildStravaErrorRedirect,
  consumeStravaState,
  exchangeStravaCodeForTokens,
  getStravaConfig,
  resolveStravaStateByNonce,
  syncStravaForAthlete,
} from '@/lib/strava'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const stateParam = req.nextUrl.searchParams.get('state')
  const authError = req.nextUrl.searchParams.get('error')
  const appUrl = req.nextUrl.origin

  const fallbackState = stateParam ? await resolveStravaStateByNonce(stateParam) : null
  const fallbackSlug = fallbackState?.slug ?? null

  if (authError || !code || !stateParam) {
    return NextResponse.redirect(buildStravaErrorRedirect(appUrl, fallbackSlug, 'denied'))
  }

  if (!getStravaConfig()) {
    return NextResponse.redirect(buildStravaErrorRedirect(appUrl, fallbackSlug, 'error', 'Brak konfiguracji Stravy'))
  }

  const { data: oauthState, error: consumeError } = await consumeStravaState(stateParam)
  const safeSlug = oauthState?.slug ?? fallbackSlug

  if (consumeError || !oauthState) {
    console.error('[strava] invalid, expired, or already consumed oauth state')
    return NextResponse.redirect(buildStravaErrorRedirect(appUrl, safeSlug, 'error', 'Nieprawidłowy lub wygasły stan autoryzacji'))
  }

  try {
    const tokens = await exchangeStravaCodeForTokens(code)
    const stravaAthleteId = tokens.athlete?.id ?? null

    if (stravaAthleteId) {
      const { data: existingConnection, error: existingError } = await adminClient
        .from('strava_connections')
        .select('athlete_id')
        .eq('strava_athlete_id', stravaAthleteId)
        .maybeSingle()

      if (existingError) {
        console.error('[strava] existing connection check failed:', existingError.message)
        return NextResponse.redirect(buildStravaErrorRedirect(appUrl, safeSlug, 'error', 'Nie udało się sprawdzić istniejącego połączenia'))
      }

      if (existingConnection && existingConnection.athlete_id !== oauthState.athlete_id) {
        return NextResponse.redirect(
          buildStravaErrorRedirect(appUrl, safeSlug, 'error', 'To konto Stravy jest już połączone z innym zawodnikiem')
        )
      }
    }

    const { error: upsertError } = await adminClient.from('strava_connections').upsert({
      athlete_id: oauthState.athlete_id,
      strava_athlete_id: stravaAthleteId,
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token!,
      expires_at: new Date(tokens.expires_at! * 1000).toISOString(),
    }, { onConflict: 'athlete_id' })

    if (upsertError) {
      console.error('[strava] upsert failed:', upsertError.message)
      return NextResponse.redirect(
        buildStravaErrorRedirect(appUrl, safeSlug, 'error', `Nie udało się zapisać połączenia: ${upsertError.message}`)
      )
    }

    try {
      await syncStravaForAthlete(oauthState.athlete_id)
    } catch (syncError) {
      console.error('[strava] initial sync failed:', syncError)
      return NextResponse.redirect(buildStravaErrorRedirect(appUrl, safeSlug, 'error', 'Połączono konto, ale synchronizacja nie udała się'))
    }

    const successTarget = safeSlug
      ? `${appUrl}/u/${encodeURIComponent(safeSlug)}/history?strava=connected`
      : `${appUrl}/?strava=connected`
    return NextResponse.redirect(successTarget)
  } catch (error) {
    console.error('[strava] callback failed:', error)
    return NextResponse.redirect(buildStravaErrorRedirect(appUrl, safeSlug, 'error', 'Błąd autoryzacji Stravy'))
  }
}
