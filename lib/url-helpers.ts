/** Update URL search params without full navigation (client-side only) */
export function updateSearchParams(params: Record<string, string | undefined>) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value)
    else url.searchParams.delete(key)
  }
  window.history.replaceState(null, '', url.toString())
}
