import type { Metadata } from 'next'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Card } from '@/components/ui/Card'

export const metadata: Metadata = { title: 'CRM | Strefa Trenera' }

export default function CrmPage() {
  return (
    <div>
      <CoachTopbar title="CRM — Pipeline klientów" subtitle="Moduł w przygotowaniu" />
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <div className="text-4xl mb-4">🚧</div>
          <h2 className="text-lg font-semibold mb-2">Moduł CRM w budowie</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Pipeline klientów będzie dostępny w przyszłej wersji aplikacji.
          </p>
        </Card>
      </div>
    </div>
  )
}
