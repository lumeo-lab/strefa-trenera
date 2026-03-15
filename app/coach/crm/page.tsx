import { CoachTopbar } from '@/components/coach/CoachTopbar'

export default function CrmPage() {
  return (
    <div>
      <CoachTopbar title="CRM — Pipeline klientów" subtitle="Moduł w przygotowaniu" />
      <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
        <div className="text-5xl mb-4">🚧</div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>CRM — wkrótce</h2>
        <p className="text-sm">Ta sekcja jest w trakcie budowy. Będzie dostępna w kolejnej aktualizacji.</p>
      </div>
    </div>
  )
}
