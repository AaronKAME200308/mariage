// Lecture/écriture CSV minimale (RFC 4180) : guillemets, retours à la ligne dans les champs, ; ou ,

export function detectDelimiter(text: string): ',' | ';' {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? ''
  return (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ','
}

export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, '')
  const delimiter = detectDelimiter(text)
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === delimiter) { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.some((v) => v.trim() !== '')) rows.push(row)
      row = []
    } else field += c
  }
  row.push(field)
  if (row.some((v) => v.trim() !== '')) rows.push(row)
  return rows
}

/** Neutralise l'injection de formules (=, +, -, @) lors de l'ouverture dans un tableur. */
function safeCell(value: string): string {
  const v = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return /[";\n\r,]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCsv(rows: Array<Array<string | number | null | undefined>>): string {
  // BOM + séparateur « ; » : ouverture directe correcte dans Excel (locale française)
  return '﻿' + rows.map((r) => r.map((c) => safeCell(String(c ?? ''))).join(';')).join('\r\n')
}

export function downloadTextFile(filename: string, content: string, mime = 'text/csv;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([content], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.append(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
