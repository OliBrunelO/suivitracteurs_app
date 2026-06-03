export function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export function formatDuration(start, end) {
  if (!start || !end) return '—'
  const ms = new Date(end) - new Date(start)
  if (ms <= 0) return '0 h 00'
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h} h ${String(m).padStart(2, '0')}`
}

export function durationHours(start, end) {
  if (!start || !end) return 0
  const ms = new Date(end) - new Date(start)
  return (ms / 3600000).toFixed(2)
}

export function toLocalDatetimeValue(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
