import { NextResponse } from 'next/server'
import { z } from 'zod'

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Podaj imię i nazwisko.').max(120),
  email: z.string().trim().email('Podaj poprawny adres email.').max(160),
  subject: z.string().trim().min(3, 'Podaj temat wiadomości.').max(160),
  message: z.string().trim().min(10, 'Wiadomość jest za krótka.').max(5000),
})

const CONTACT_EMAIL = 'kontakt@strefa-trenera.pl'
const CONTACT_FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'Strefa Trenera <onboarding@resend.dev>'

export async function POST(req: Request) {
  const json = await req.json().catch(() => null)
  const parsed = contactSchema.safeParse(json)

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return NextResponse.json({ error: issue?.message || 'Nieprawidłowe dane formularza.' }, { status: 400 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'Formularz kontaktowy nie jest jeszcze skonfigurowany na serwerze.' },
      { status: 500 },
    )
  }

  const { name, email, subject, message } = parsed.data

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: CONTACT_FROM_EMAIL,
      to: [CONTACT_EMAIL],
      reply_to: email,
      subject: `${subject} — ${name}`,
      text: [
        'Nowa wiadomość z formularza pomocy Strefy Trenera.',
        '',
        `Imię i nazwisko: ${name}`,
        `Email: ${email}`,
        `Temat: ${subject}`,
        '',
        'Wiadomość:',
        message,
      ].join('\n'),
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    return NextResponse.json(
      { error: errorText || 'Nie udało się wysłać wiadomości. Spróbuj ponownie.' },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true })
}
