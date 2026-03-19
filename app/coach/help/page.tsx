import Link from 'next/link'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Card } from '@/components/ui/Card'
import { QUICK_ACTIONS } from './_components/faq-data'
import { HelpFaq } from './_components/HelpFaq'
import { HelpContact } from './_components/HelpContact'

export default function HelpPage() {
  return (
    <div>
      <CoachTopbar title="Pomoc" subtitle="FAQ, szybkie skróty i kontakt" />

      <div className="p-6 max-w-4xl mx-auto space-y-8">

        {/* Quick actions */}
        <Card className="p-6">
          <h2 className="font-bold text-lg">Szybkie skróty</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Najczęstsze miejsca, do których trener wraca podczas codziennej pracy.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-5">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 rounded-xl px-4 py-3 transition-opacity hover:opacity-85"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              >
                <span className="text-xl">{action.icon}</span>
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            ))}
          </div>
        </Card>

        {/* FAQ */}
        <HelpFaq />

        {/* Contact */}
        <HelpContact />

      </div>
    </div>
  )
}
