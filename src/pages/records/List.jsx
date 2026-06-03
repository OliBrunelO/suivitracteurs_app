import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout'
import { useWorkRecords } from '../../hooks/useWorkRecords'
import { useTractors } from '../../hooks/useTractors'
import { useTools } from '../../hooks/useTools'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { supabase } from '../../lib/supabase'
import { exportToCSV } from '../../lib/exportCSV'
import { formatDateTime, formatDuration, durationHours } from '../../lib/utils'

export default function RecordList() {
  const { profile, isAdmin } = useAuth()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', tractorId: '', driverId: '', toolId: '' })
  const [drivers, setDrivers] = useState([])

  const { tractors } = useTractors()
  const { tools } = useTools()
  const { records, loading, total, pageSize } = useWorkRecords({ page, ...filters })

  useEffect(() => {
    if (isAdmin) {
      supabase.from('profiles').select('id, full_name').eq('role', 'driver').order('full_name')
        .then(({ data }) => setDrivers(data || []))
    }
  }, [isAdmin])

  function setFilter(key, val) {
    setFilters(f => ({ ...f, [key]: val }))
    setPage(1)
  }

  function resetFilters() {
    setFilters({ dateFrom: '', dateTo: '', tractorId: '', driverId: '', toolId: '' })
    setPage(1)
  }

  async function handleExport() {
    let query = supabase
      .from('work_records')
      .select(`
        *,
        tractor:tractors(id, name),
        driver:profiles!work_records_driver_id_fkey(full_name),
        created_by_profile:profiles!work_records_created_by_fkey(full_name),
        work_record_tools(tool:tools(name))
      `)
      .order('started_at', { ascending: false })

    if (filters.dateFrom)  query = query.gte('started_at', filters.dateFrom)
    if (filters.dateTo)    query = query.lte('started_at', filters.dateTo + 'T23:59:59')
    if (filters.tractorId) query = query.eq('tractor_id', filters.tractorId)
    if (filters.driverId)  query = query.eq('driver_id', filters.driverId)

    const { data } = await query
    const records = data || []

    // Récupérer le boîtier GPS affecté à chaque tracteur AU MOMENT du travail
    // (affectation active pendant la plage started_at → ended_at)
    const tractorIds = [...new Set(records.map(r => r.tractor_id).filter(Boolean))]
    let deviceMap = {}

    if (tractorIds.length > 0) {
      const { data: assignments } = await supabase
        .from('device_assignments')
        .select('tractor_id, assigned_at, unassigned_at, device:devices(serial_number)')
        .in('tractor_id', tractorIds)

      // Pour chaque enregistrement, trouver le boîtier actif à started_at
      records.forEach(r => {
        const match = (assignments || []).find(a =>
          a.tractor_id === r.tractor_id &&
          new Date(a.assigned_at) <= new Date(r.started_at) &&
          (a.unassigned_at === null || new Date(a.unassigned_at) >= new Date(r.started_at))
        )
        deviceMap[r.id] = match?.device?.serial_number ?? ''
      })
    }

    const rows = records.map(r => ({
      date_debut:     new Date(r.started_at).toLocaleString('fr-FR'),
      date_fin:       new Date(r.ended_at).toLocaleString('fr-FR'),
      duree_heures:   durationHours(r.started_at, r.ended_at),
      tracteur:       r.tractor?.name ?? '',
      id_boitier_gps: deviceMap[r.id] ?? '',
      outils:         r.work_record_tools?.map(wrt => wrt.tool?.name).join(' | ') ?? '',
      chauffeur:      r.driver?.full_name ?? '',
      saisi_par:      r.created_by_profile?.full_name ?? '',
      notes:          r.notes ?? '',
    }))

    exportToCSV(rows, `travaux_${new Date().toISOString().slice(0,10)}.csv`)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Travaux enregistrés</h1>
          <p className="text-sm text-gray-500">{total} résultat{total > 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport} className="hidden sm:inline-flex">📥 Export CSV</Button>
          <Button variant="secondary" size="sm" onClick={handleExport} className="sm:hidden">📥</Button>
          <Button as={Link} to="/records/new" size="sm">+ Nouveau</Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Input
            label="Date début"
            type="date"
            value={filters.dateFrom}
            onChange={e => setFilter('dateFrom', e.target.value)}
          />
          <Input
            label="Date fin"
            type="date"
            value={filters.dateTo}
            onChange={e => setFilter('dateTo', e.target.value)}
          />
          <Select
            label="Tracteur"
            value={filters.tractorId}
            onChange={e => setFilter('tractorId', e.target.value)}
            options={tractors.map(t => ({ value: t.id, label: t.name }))}
            placeholder="Tous"
          />
          <Select
            label="Outil"
            value={filters.toolId}
            onChange={e => setFilter('toolId', e.target.value)}
            options={tools.map(t => ({ value: t.id, label: t.name }))}
            placeholder="Tous"
          />
          {isAdmin && (
            <Select
              label="Chauffeur"
              value={filters.driverId}
              onChange={e => setFilter('driverId', e.target.value)}
              options={drivers.map(d => ({ value: d.id, label: d.full_name }))}
              placeholder="Tous"
            />
          )}
        </div>
        {Object.values(filters).some(Boolean) && (
          <button onClick={resetFilters} className="mt-3 text-xs text-gray-500 hover:text-red-600">
            ✕ Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* Liste / Tableau */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>Aucun enregistrement trouvé</p>
          </div>
        ) : (
          <>
            {/* Cartes — mobile uniquement */}
            <div className="md:hidden divide-y divide-gray-100">
              {records.map(r => (
                <Link
                  key={r.id}
                  to={`/records/${r.id}`}
                  className="flex flex-col gap-2 px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-gray-900 text-sm">{r.tractor?.name}</span>
                    {r.ended_at
                      ? <Badge color="green">{formatDuration(r.started_at, r.ended_at)}</Badge>
                      : <Badge color="yellow">⏳ En cours</Badge>
                    }
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDateTime(r.started_at)} → {r.ended_at ? formatDateTime(r.ended_at) : <span className="text-amber-600 font-medium">En cours</span>}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {r.work_record_tools?.map((wrt, i) => (
                      <Badge key={i} color="gray">{wrt.tool?.name}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Chauffeur : <span className="text-gray-600">{r.driver?.full_name}</span></span>
                    <span className="text-primary-600 font-medium">Voir →</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Tableau — tablette et desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <Th>Début</Th>
                    <Th>Fin</Th>
                    <Th>Durée</Th>
                    <Th>Tracteur</Th>
                    <Th>Outils</Th>
                    <Th>Chauffeur</Th>
                    <Th>Saisi par</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {records.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <Td>{formatDateTime(r.started_at)}</Td>
                      <Td>{r.ended_at ? formatDateTime(r.ended_at) : <Badge color="yellow">⏳ En cours</Badge>}</Td>
                      <Td>
                        {r.ended_at
                          ? <Badge color="green">{formatDuration(r.started_at, r.ended_at)}</Badge>
                          : <span className="text-gray-300">—</span>
                        }
                      </Td>
                      <Td className="font-medium">{r.tractor?.name}</Td>
                      <Td>
                        <div className="flex flex-wrap gap-1">
                          {r.work_record_tools?.slice(0, 2).map((wrt, i) => (
                            <Badge key={i} color="gray">{wrt.tool?.name}</Badge>
                          ))}
                          {(r.work_record_tools?.length ?? 0) > 2 && (
                            <Badge color="gray">+{r.work_record_tools.length - 2}</Badge>
                          )}
                        </div>
                      </Td>
                      <Td>{r.driver?.full_name}</Td>
                      <Td className="text-gray-400">{r.created_by_profile?.full_name}</Td>
                      <Td>
                        <Link to={`/records/${r.id}`} className="text-primary-600 hover:underline font-medium">
                          Voir
                        </Link>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Page {page} / {totalPages} — {total} résultats
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                ← Précédent
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Suivant →
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function Th({ children }) {
  return <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{children}</th>
}
function Td({ children, className = '' }) {
  return <td className={`px-4 py-3 text-gray-700 ${className}`}>{children}</td>
}
