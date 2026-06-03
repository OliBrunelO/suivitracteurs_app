/**
 * Exporte un tableau d'objets en fichier CSV compatible Excel FR.
 * - Séparateur : ";"
 * - Encodage UTF-8 avec BOM (pour les accents sous Excel)
 */
export function exportToCSV(data, filename = 'export.csv') {
  if (!data || data.length === 0) return

  const headers = Object.keys(data[0])
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h] === null || row[h] === undefined ? '' : String(row[h])
      // Échapper les guillemets et encadrer si nécessaire
      if (val.includes(';') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    }).join(';')
  )

  const csvContent = '﻿' + [headers.join(';'), ...rows].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
