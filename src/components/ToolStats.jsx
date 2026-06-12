import { useState, useEffect } from 'react'
import {
  PieChart, Pie, Cell, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend,
  ResponsiveContainer,
} from 'recharts'
import { supabase } from '../lib/supabase'
import { computeWorkedDurationMs } from '../lib/utils'

const MAX_PER_DAY_MS = 7 * 3600000

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6b7280',
]

function computeCappedDurationMs(record, pauses) {
  const start = new Date(record.started_at)
  const end = record.ended_at ? new Date(record.ended_at) : new Date()
  let workingDays = 0
  const cursor = new Date(start)
  cursor.setHours(0, 0, 0, 0)
  const startDateStr = cursor.toDateString()
  while (cursor <= end) {
    const dow = cursor.getDay()
    if (!(dow === 0 || dow === 6) || cursor.toDateString() === startDateStr) workingDays++
    cursor.setDate(cursor.getDate() + 1)
  }
  const rawMs = computeWorkedDurationMs(record, pauses)
  return Math.min(rawMs, workingDays * MAX_PER_DAY_MS)
}

function fmtMs(ms) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${h} h ${String(m).padStart(2, '0')}`
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function firstDayOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function firstDayOfYear() {
  return `${new Date().getFullYear()}-01-01`
}

// Tooltip personnalisé pour le camembert
function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, ms } = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-800">{name}</p>
      <p className="text-gray-600">{fmtMs(ms)}</p>
    </div>
  )
}


export function ToolStats() {
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth())
  const [dateTo, setDateTo]   = useState(todayStr())
  const [viewMode, setViewMode] = useState('barres')
  const [toolStats, setToolStats] = useState([])
  const [lineData, setLineData] = useState([])
  const [lineKeys, setLineKeys] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadStats() }, [dateFrom, dateTo])

  async function loadStats() {
    setLoading(true)
    let query = supabase
      .from('work_records')
      .select(`
        started_at, ended_at,
        work_record_tools(tool:tools(id, name)),
        work_record_pauses(paused_at, resumed_at)
      `)
    if (dateFrom) query = query.gte('started_at', dateFrom)
    if (dateTo)   query = query.lte('started_at', dateTo + 'T23:59:59')

    const { data } = await query
    const totals = {}
    const daily = {}
    const toolNameSet = new Set()

    for (const rec of data || []) {
      const ms = computeCappedDurationMs(rec, rec.work_record_pauses || [])
      const day = rec.started_at?.slice(0, 10)
      for (const wrt of rec.work_record_tools || []) {
        const name = wrt.tool?.name
        if (!name) continue
        toolNameSet.add(name)
        totals[name] = (totals[name] || 0) + ms
        if (day) {
          if (!daily[day]) daily[day] = {}
          daily[day][name] = (daily[day][name] || 0) + ms
        }
      }
    }

    const sorted = Object.entries(totals)
      .map(([name, ms]) => ({ name, ms, hours: +(ms / 3600000).toFixed(2) }))
      .sort((a, b) => b.ms - a.ms)
    setToolStats(sorted)
    const keys = sorted.map(t => t.name)
    setLineKeys(keys)

    // Aires empilées : heures par jour pour chaque outil
    const points = Object.keys(daily).sort().map(date => {
      const entry = { date }
      for (const name of keys) {
        entry[name] = daily[date]?.[name] ? +(daily[date][name] / 3600000).toFixed(2) : 0
      }
      return entry
    })
    setLineData(points)
    setLoading(false)
  }

  function applyPreset(preset) {
    const today = todayStr()
    if (preset === 'mois')  { setDateFrom(firstDayOfMonth()); setDateTo(today) }
    if (preset === 'année') { setDateFrom(firstDayOfYear());  setDateTo(today) }
    if (preset === 'tout')  { setDateFrom(''); setDateTo('') }
  }

  const maxMs = toolStats[0]?.ms || 1
  const totalMs = toolStats.reduce((s, t) => s + t.ms, 0)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">

      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">Durée par outil</h2>
        <div className="flex gap-1">
          {[['barres', '≡ Barres'], ['graphique', '◉ Graphique']].map(([m, label]) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === m
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium">Du</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
          <label className="text-xs text-gray-500 font-medium">au</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
        <div className="flex gap-1 ml-auto">
          {[['mois', 'Ce mois'], ['année', 'Cette année'], ['tout', 'Tout']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className="px-2.5 py-1 rounded text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full" />
        </div>
      ) : toolStats.length === 0 ? (
        <p className="text-center py-10 text-gray-400 text-sm">Aucun travail sur cette période</p>
      ) : viewMode === 'barres' ? (

        /* ── Vue barres ── */
        <div className="px-5 py-4 flex flex-col gap-3">
          {toolStats.map(({ name, ms }, i) => (
            <div key={name} className="flex items-center gap-3">
              <span
                className="text-sm text-gray-700 w-40 shrink-0 truncate"
                title={name}
              >
                {name}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round((ms / maxMs) * 100)}%`,
                    backgroundColor: COLORS[i % COLORS.length],
                  }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-800 w-16 text-right shrink-0">
                {fmtMs(ms)}
              </span>
              <span className="text-xs text-gray-400 w-8 text-right shrink-0">
                {Math.round((ms / totalMs) * 100)} %
              </span>
            </div>
          ))}
          <div className="pt-2 border-t border-gray-100 flex justify-between text-xs text-gray-500 font-medium">
            <span>Total</span>
            <span>{fmtMs(totalMs)}</span>
          </div>
        </div>

      ) : (

        /* ── Vue graphique ── */
        <div className="flex flex-col md:flex-row items-center gap-4 px-5 py-4">

          {/* Camembert */}
          <div className="w-full md:w-64 shrink-0" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={toolStats}
                  dataKey="ms"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {toolStats.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Aires empilées par jour */}
          <div className="flex-1 w-full" style={{ height: 240 }}>
            <p className="text-[10px] text-gray-400 text-right pr-1 mb-0.5">heures par jour</p>
            {lineData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">
                Aucune donnée sur cette période
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lineData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    tickFormatter={d => d.slice(5).split('-').reverse().join('/')}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={v => `${v} h`}
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    formatter={(v, name) => v > 0 ? [`${v} h`, name] : null}
                    labelFormatter={d => d.slice(5).split('-').reverse().join('/')}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {lineKeys.map((name, i) => (
                    <Area
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stackId="1"
                      stroke={COLORS[i % COLORS.length]}
                      fill={COLORS[i % COLORS.length]}
                      fillOpacity={0.75}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Total général */}
      {!loading && toolStats.length > 0 && viewMode === 'graphique' && (
        <div className="px-5 pb-3 text-right text-xs text-gray-500">
          Total : <span className="font-semibold text-gray-700">{fmtMs(totalMs)}</span>
        </div>
      )}
    </div>
  )
}
