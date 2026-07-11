import * as XLSX from 'xlsx'

export type ExportRow = Record<string, string | number | boolean | null | undefined>

function normalizeRows(rows: ExportRow[]) {
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, value ?? '']),
    ),
  )
}

export function exportRowsToCsv(rows: ExportRow[], filename: string) {
  const sheet = XLSX.utils.json_to_sheet(normalizeRows(rows))
  const csv = XLSX.utils.sheet_to_csv(sheet)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function exportRowsToXlsx(rows: ExportRow[], filename: string, sheetName = 'Export') {
  const sheet = XLSX.utils.json_to_sheet(normalizeRows(rows))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName.slice(0, 31))
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

export function buildExportFilename(base: string, page: number) {
  const date = new Date().toISOString().slice(0, 10)
  return `${base}-page-${page}-${date}`
}
