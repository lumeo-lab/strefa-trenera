import { formatCurrency, formatDate } from '@/lib/utils'
import type { StatusDef } from '@/lib/useCustomStatuses'

function escapeExcelHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface AthleteForExport {
  id: string
  name: string
  email: string | null
  phone: string | null
  city: string | null
  age: number | null
  goal: string | null
  package: string
  package_price: number | null
  status: string
  join_date: string
}

interface ExportMaps {
  lastSessionMap: Record<string, { date: string; type: string }>
  nextSessionMap: Record<string, { date: string; type: string }>
  nextRaceMap: Record<string, { name: string; date: string; distance?: string | null }>
  signalMap: Record<string, string>
  lastFeedbackDateMap: Record<string, string>
  complianceMap: Record<string, { completed: number; total: number }>
  weeklyLoadMap: Record<string, number>
  weeklySessionCountMap: Record<string, number>
  unreadMessagesMap: Record<string, number>
  unreadFeedbackMap: Record<string, number>
  unpaidInvoiceSet: Record<string, boolean>
  signalLabels: Record<string, string>
  getStatusDef: (key: string) => StatusDef
}

export function exportAthletesToExcel(athletes: AthleteForExport[], maps: ExportMaps) {
  const columns: Array<{ label: string; value: (a: AthleteForExport, i: number) => string | number }> = [
    { label: 'Lp.', value: (_a, i) => i + 1 },
    { label: 'Imię i nazwisko', value: (a) => a.name },
    { label: 'Email', value: (a) => a.email ?? '' },
    { label: 'Telefon', value: (a) => a.phone ?? '' },
    { label: 'Miasto', value: (a) => a.city ?? '' },
    { label: 'Wiek', value: (a) => a.age !== null ? a.age : '' },
    { label: 'Cel', value: (a) => a.goal ?? '' },
    { label: 'Pakiet', value: (a) => a.package?.trim() ?? '' },
    { label: 'Cena pakietu', value: (a) => a.package_price ? formatCurrency(a.package_price) : '' },
    { label: 'Płatność', value: (a) => maps.unpaidInvoiceSet[a.id] ? 'Nieopłacone' : 'OK' },
    { label: 'Status zawodnika', value: (a) => maps.getStatusDef(a.status).label },
    { label: 'Nieprzeczytane wiadomości', value: (a) => maps.unreadMessagesMap[a.id] ?? 0 },
    { label: 'Nieprzeczytane feedbacki', value: (a) => maps.unreadFeedbackMap[a.id] ?? 0 },
    { label: 'Ostatni trening - data', value: (a) => maps.lastSessionMap[a.id]?.date ? formatDate(maps.lastSessionMap[a.id].date, { day: 'numeric', month: 'short', year: 'numeric' }) : '' },
    { label: 'Ostatni trening - typ', value: (a) => maps.lastSessionMap[a.id]?.type ?? '' },
    { label: 'Następna sesja - data', value: (a) => maps.nextSessionMap[a.id]?.date ? formatDate(maps.nextSessionMap[a.id].date, { day: 'numeric', month: 'short', year: 'numeric' }) : '' },
    { label: 'Następna sesja - typ', value: (a) => maps.nextSessionMap[a.id]?.type ?? '' },
    { label: 'Sygnał formy', value: (a) => maps.signalLabels[maps.signalMap[a.id] ?? ''] ?? '' },
    { label: 'Ostatni feedback', value: (a) => maps.lastFeedbackDateMap[a.id] ? new Date(maps.lastFeedbackDateMap[a.id]).toLocaleString('pl-PL') : '' },
    { label: 'Realizacja 30 dni (%)', value: (a) => { const c = maps.complianceMap[a.id]; return c ? `${Math.round((c.completed / c.total) * 100)}%` : '' } },
    { label: 'Realizacja 30 dni - ukończone sesje', value: (a) => maps.complianceMap[a.id]?.completed ?? 0 },
    { label: 'Realizacja 30 dni - wszystkie sesje', value: (a) => maps.complianceMap[a.id]?.total ?? 0 },
    { label: 'Obciążenie 7 dni (km)', value: (a) => { const km = maps.weeklyLoadMap[a.id] ?? 0; return km ? Number(km).toFixed(0) : '' } },
    { label: 'Obciążenie 7 dni - sesje', value: (a) => maps.weeklySessionCountMap[a.id] ?? 0 },
    { label: 'Następne zawody - nazwa', value: (a) => maps.nextRaceMap[a.id]?.name ?? '' },
    { label: 'Następne zawody - data', value: (a) => maps.nextRaceMap[a.id]?.date ? formatDate(maps.nextRaceMap[a.id].date, { day: 'numeric', month: 'short', year: 'numeric' }) : '' },
    { label: 'Następne zawody - dystans', value: (a) => maps.nextRaceMap[a.id]?.distance ?? '' },
    { label: 'Data dołączenia', value: (a) => a.join_date ? formatDate(a.join_date, { day: 'numeric', month: 'short', year: 'numeric' }) : '' },
  ]

  const generatedAt = new Date()
  const headerCells = columns.map((c) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeExcelHtml(c.label)}</Data></Cell>`).join('')
  const dataRows = athletes.map((a, i) => `<Row>${columns.map((c) => `<Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeExcelHtml(c.value(a, i))}</Data></Cell>`).join('')}</Row>`).join('')

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1" ss:Color="#C2410C" />
      <Interior ss:Color="#FFF3ED" ss:Pattern="Solid" />
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDBA74" />
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDBA74" />
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDBA74" />
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDBA74" />
      </Borders>
    </Style>
    <Style ss:ID="Cell">
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB" />
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB" />
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB" />
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB" />
      </Borders>
    </Style>
    <Style ss:ID="Meta"><Font ss:Color="#6B7280" /></Style>
    <Style ss:ID="Title"><Font ss:Bold="1" ss:Size="14" /></Style>
  </Styles>
  <Worksheet ss:Name="Zawodnicy">
    <Table>
      <Row><Cell ss:StyleID="Title"><Data ss:Type="String">Eksport zawodników</Data></Cell></Row>
      <Row><Cell ss:StyleID="Meta"><Data ss:Type="String">Wygenerowano: ${escapeExcelHtml(generatedAt.toLocaleString('pl-PL'))}</Data></Cell></Row>
      <Row><Cell ss:StyleID="Meta"><Data ss:Type="String">Liczba rekordów: ${escapeExcelHtml(athletes.length)}</Data></Cell></Row>
      <Row><Cell ss:StyleID="Meta"><Data ss:Type="String">Zakres: bieżący widok listy zawodników</Data></Cell></Row>
      <Row />
      <Row>${headerCells}</Row>
      ${dataRows}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><DisplayGridlines /></WorksheetOptions>
  </Worksheet>
</Workbook>`

  const blob = new Blob(['\uFEFF' + xml], { type: 'application/xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `zawodnicy_${new Date().toISOString().slice(0, 10)}.xml`
  link.click()
  URL.revokeObjectURL(url)
}
