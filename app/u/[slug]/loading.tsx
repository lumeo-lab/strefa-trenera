export default function AthleteLoading() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="animate-pulse" style={{ fontSize: '32px', marginBottom: '12px' }}>🏃</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Ładowanie...</div>
      </div>
    </div>
  )
}
