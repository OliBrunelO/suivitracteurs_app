import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getWorkStatus } from '../lib/utils'

const FR_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function getMonday(offset = 0) {
  const d = new Date()
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1) + offset * 7)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(d, n) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function dayKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtShort(d) {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

function recordColor(record) {
  const status = getWorkStatus(record, record.work_record_pauses || [])
  if (status === 'en_cours') return 'bg-amber-50 border-l-[3px] border-amber-400 text-amber-900'
  if (status === 'en_pause') return 'bg-purple-50 border-l-[3px] border-purple-400 text-purple-900'
  return 'bg-green-50 border-l-[3px] border-green-400 text-green-900'
}

export function WeeklyView() {
  const [mode, setMode] = useState('tracteur')
  const [weekOffset, setWeekOffset] = useState(0)
  const [showWeekend, setShowWeekend] = useState(false)
  const [records, setRecords] = useState([])
  const [allTractors, setAllTractors] = useState([])
  const [allDrivers, setAllDrivers] = useState([])
  const [loading, setLoading] = useState(true)

  const monday = getMonday(weekOffset)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
  const visibleDays = showWeekend ? weekDays : weekDays.slice(0, 5)
  const todayKey = dayKey(new Date())

  useEffect(() => { loadWeek() }, [weekOffset])

  async function loadWeek() {
    setLoading(true)
    const weekStart = monday.toISOString()
    const weekEnd = addDays(monday, 7).toISOString()

    const [
      { data: recs },
      { data: tractors },
      { data: drivers },
    ] = await Promise.all([
      supabase
        .from('work_records')
        .select(`
          id, started_at, ended_at,
          tractor:tractors(id, name),
          driver:profiles!work_records_driver_id_fkey(id, full_name),
          work_record_tools(tool:tools(name)),
          work_record_pauses(paused_at, resumed_at)
        `)
        .lt('started_at', weekEnd)
        .or(`ended_at.gte.${weekStart},ended_at.is.null`)
        .order('started_at'),
      supabase.from('tractors').select('id, name').eq('active', true).order('name'),
      supabase.from('profiles').select('id, full_name').eq('role', 'driver').order('full_name'),
    ])

    setRecords(recs || [])
    setAllTractors(tractors || [])
    setAllDrivers(drivers || [])
    setLoading(false)
  }

  function buildGrid() {
    const allRows = mode === 'tracteur'
      ? allTractors.map(t => t.name)
      : allDrivers.map(d => d.full_name)

    const grid = {}
    for (const r of allRows) grid[r] = {}

    for (const rec of records) {
      const rowKey = mode === 'tracteur' ? rec.tractor?.name : rec.driver?.full_name
      if (!rowKey || !(rowKey in grid)) continue

      const start = new Date(rec.started_at)
      const end = rec.ended_at ? new Date(rec.ended_at) : new Date()
      const startKey = dayKey(start)

      for (const day of weekDays) {
        const isWeekend = day.getDay() === 0 || day.getDay() === 6
        if (isWeekend && dayKey(day) !== startKey) continue

        const d0 = new Date(day); d0.setHours(0, 0, 0, 0)
        const d1 = new Date(day); d1.setHours(23, 59, 59, 999)
        if (start <= d1 && end >= d0) {
          const k = dayKey(day)
          if (!grid[rowKey][k]) grid[rowKey][k] = []
          grid[rowKey][k].push(rec)
        }
      }
    }

    return { grid, rows: allRows }
  }

  const { grid, rows } = buildGrid()

  // Séparation occupés / disponibles
  const busyRows = rows.filter(rowKey =>
    visibleDays.some(day => grid[rowKey]?.[dayKey(day)]?.length > 0)
  )
  const freeRows = rows.filter(rowKey =>
    visibleDays.every(day => !grid[rowKey]?.[dayKey(day)]?.length)
  )

  function renderRow(rowKey, ri, dimmed) {
    return (
      <tr key={rowKey} className={`border-t border-gray-100 ${ri % 2 === 1 ? 'bg-gray-50/40' : ''}`}>
        <td className={`px-3 py-1.5 text-xs font-semibold border-r border-gray-100 align-middle whitespace-nowrap ${dimmed ? 'text-gray-400' : 'text-gray-700'}`}>
          {rowKey}
        </td>
        {visibleDays.map((day, ci) => {
          const k = dayKey(day)
          const items = grid[rowKey]?.[k] || []
          const isWeekend = day.getDay() === 0 || day.getDay() === 6
          return (
            <td key={ci} className={`px-1 py-1 align-top ${isWeekend ? 'bg-gray-100/50' : ''}`}>
              <div className="flex flex-col gap-0.5">
                {items.map(r => (
                  <Link
                    key={r.id}
                    to={`/records/${r.id}`}
                    title={`${r.driver?.full_name} — ${r.tractor?.name}`}
                    className={`block rounded-sm px-1.5 py-0.5 text-[11px] leading-tight hover:opacity-75 transition-opacity ${recordColor(r)}`}
                  >
                    <div className="font-semibold truncate" style={{ maxWidth: 90 }}>
                      {mode === 'tracteur' ? r.driver?.full_name : r.tractor?.name}
                    </div>
                    {r.work_record_tools?.length > 0 && (
                      <div className="opacity-60 text-[10px] truncate" style={{ maxWidth: 90 }}>
                        {r.work_record_tools.slice(0, 2).map(wrt => wrt.tool?.name).filter(Boolean).join(', ')}
                        {r.work_record_tools.length > 2 ? '…' : ''}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </td>
          )
        })}
        <td className="bg-gray-100/50" />
      </tr>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-800 text-sm">Planning semaine</h2>
          <div className="flex gap-1 ml-1">
            {[['tracteur', '🚜 Tracteur'], ['personne', '👤 Personne']].map(([m, label]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  mode === m
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekOffset(o => o - 1)}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 text-lg leading-none"
          >
            ‹
          </button>
          <span className="text-xs font-medium text-gray-600 w-24 text-center">
            {fmtShort(weekDays[0])} – {fmtShort(weekDays[6])}
          </span>
          <button
            onClick={() => setWeekOffset(o => o + 1)}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 text-lg leading-none"
          >
            ›
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs text-primary-600 hover:underline ml-1"
              title="Revenir à cette semaine"
            >
              ↩
            </button>
          )}
        </div>
      </div>

      {/* Grille */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 480 }}>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-2.5 w-28 min-w-[7rem] border-r border-gray-100">
                  {mode === 'tracteur' ? 'Tracteur' : 'Chauffeur'}
                </th>
                {visibleDays.map((day, i) => {
                  const isToday = dayKey(day) === todayKey
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6
                  const label = FR_DAYS[(day.getDay() + 6) % 7]
                  return (
                    <th key={i} className={`text-center px-1 py-2 min-w-[5.5rem] ${isWeekend ? 'bg-gray-100/80' : ''}`}>
                      <div className={`text-[10px] font-semibold uppercase tracking-wide ${isToday ? 'text-primary-500' : 'text-gray-400'}`}>
                        {label}
                      </div>
                      <div className={`text-base font-bold leading-tight mt-0.5 ${isToday ? 'text-primary-600' : 'text-gray-700'}`}>
                        {day.getDate()}
                      </div>
                    </th>
                  )
                })}
                <th className="px-2 py-2 bg-gray-100/80 w-14 text-center">
                  <button
                    onClick={() => setShowWeekend(s => !s)}
                    className="text-[10px] text-gray-400 hover:text-gray-700 whitespace-nowrap font-normal transition-colors"
                  >
                    {showWeekend ? '‹ Replier' : 'W-E ›'}
                  </button>
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={visibleDays.length + 2} className="text-center py-10 text-gray-400 text-xs">
                    Aucune ressource configurée
                  </td>
                </tr>
              ) : (
                <>
                  {busyRows.map((rowKey, ri) => renderRow(rowKey, ri, false))}

                  {freeRows.length > 0 && (
                    <>
                      <tr className="border-t-2 border-emerald-100">
                        <td
                          colSpan={visibleDays.length + 2}
                          className="px-3 py-1 bg-emerald-50 text-[10px] font-semibold text-emerald-600 uppercase tracking-wide"
                        >
                          Disponibles cette semaine
                        </td>
                      </tr>
                      {freeRows.map((rowKey, ri) => renderRow(rowKey, ri, true))}
                    </>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Légende */}
      <div className="flex items-center gap-4 px-5 py-2 border-t border-gray-100 bg-gray-50/60">
        <span className="text-[10px] text-gray-400 font-medium">Légende :</span>
        {[
          ['bg-green-400', 'Terminé'],
          ['bg-amber-400', 'En cours'],
          ['bg-purple-400', 'En pause'],
        ].map(([cls, label]) => (
          <span key={label} className="flex items-center gap-1 text-[10px] text-gray-500">
            <span className={`w-2 h-2 rounded-[2px] inline-block ${cls}`} />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1 text-[10px] text-emerald-600 ml-1">
          <span className="w-2 h-2 rounded-[2px] inline-block bg-emerald-200" />
          Disponible
        </span>
      </div>
    </div>
  )
}
