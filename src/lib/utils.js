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

// 'terminé' | 'en_pause' | 'en_cours'
export function getWorkStatus(record, pauses) {
  if (record.ended_at) return 'terminé'
  const sorted = [...(pauses || [])].sort((a, b) => new Date(a.paused_at) - new Date(b.paused_at))
  if (sorted.length > 0 && !sorted[sorted.length - 1].resumed_at) return 'en_pause'
  return 'en_cours'
}

// Durée travaillée en ms (hors pauses). Si en cours, compte jusqu'à maintenant.
export function computeWorkedDurationMs(record, pauses) {
  const sorted = [...(pauses || [])].sort((a, b) => new Date(a.paused_at) - new Date(b.paused_at))
  let totalMs = 0
  let segStart = new Date(record.started_at)

  for (const pause of sorted) {
    totalMs += new Date(pause.paused_at) - segStart
    if (pause.resumed_at) {
      segStart = new Date(pause.resumed_at)
    } else {
      return Math.max(0, totalMs) // actuellement en pause
    }
  }

  const segEnd = record.ended_at ? new Date(record.ended_at) : new Date()
  return Math.max(0, totalMs + (segEnd - segStart))
}

export function formatWorkedDuration(record, pauses) {
  const ms = computeWorkedDurationMs(record, pauses)
  if (ms <= 0) return '0 h 00'
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h} h ${String(m).padStart(2, '0')}`
}

// Construit la liste chronologique des segments travail/pause
export function buildWorkTimeline(record, pauses) {
  const sorted = [...(pauses || [])].sort((a, b) => new Date(a.paused_at) - new Date(b.paused_at))
  const segments = []
  let currentStart = record.started_at

  for (const pause of sorted) {
    segments.push({ type: 'work', start: currentStart, end: pause.paused_at })
    segments.push({ type: 'pause', start: pause.paused_at, end: pause.resumed_at })
    currentStart = pause.resumed_at
  }

  if (currentStart) {
    segments.push({ type: 'work', start: currentStart, end: record.ended_at })
  }

  return segments
}
