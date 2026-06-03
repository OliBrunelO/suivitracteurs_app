import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AppLayout } from '../components/layout/AppLayout'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { supabase } from '../lib/supabase'
import { formatDuration, formatDateTime } from '../lib/utils'

export default function Dashboard() {
  const { profile, isAdmin, isSuperAdmin } = useAuth()
  const [recentRecords, setRecentRecords] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [profile])

  async function loadData() {
    if (!profile) return
    setLoading(true)

    let query = supabase
      .from('work_records')
      .select(`
        *,
        tractor:tractors(name),
        driver:profiles!work_records_driver_id_fkey(full_name),
        work_record_tools(tool:tools(name))
      `)
      .order('started_at', { ascending: false })
      .limit(5)

    const { data } = await query
    setRecentRecords(data || [])

    // Statistiques simples
    const { count } = await supabase
      .from('work_records')
      .select('id', { count: 'exact', head: true })

    setStats({ total: count || 0 })
    setLoading(false)
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bonjour, {profile?.full_name} 👋</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tableau de bord</p>
        </div>
        <Button as={Link} to="/records/new">
          + Nouveau travail
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Total travaux"
          value={stats?.total ?? '—'}
          icon="📋"
          loading={loading}
        />
        <StatCard
          label="Ce mois-ci"
          value="—"
          icon="📅"
          loading={loading}
        />
        <StatCard
          label="Mon rôle"
          value={profile?.role === 'superadmin' ? 'Super Admin' : profile?.role === 'admin' ? 'Admin' : 'Chauffeur'}
          icon="👤"
          loading={false}
        />
      </div>

      {/* Derniers travaux */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Derniers travaux enregistrés</h2>
          <Link to="/records" className="text-sm text-primary-600 hover:underline">Voir tout</Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : recentRecords.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">Aucun travail enregistré</p>
            <Link to="/records/new">
              <Button className="mt-4" size="sm">Créer le premier enregistrement</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentRecords.map(r => (
              <Link
                key={r.id}
                to={`/records/${r.id}`}
                className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {r.tractor?.name} — {r.driver?.full_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(r.started_at)}
                    {r.ended_at
                      ? ` · ${formatDuration(r.started_at, r.ended_at)}`
                      : <span className="text-amber-500 ml-1">⏳ En cours</span>
                    }
                  </p>
                </div>
                <div className="flex gap-1 flex-wrap justify-end">
                  {r.work_record_tools?.slice(0, 2).map((wrt, i) => (
                    <Badge key={i} color="gray">{wrt.tool?.name}</Badge>
                  ))}
                  {(r.work_record_tools?.length ?? 0) > 2 && (
                    <Badge color="gray">+{r.work_record_tools.length - 2}</Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Liens rapides admin et superadmin */}
      {isAdmin && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Link to="/admin/config/tractors" className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow flex items-center gap-3">
            <span className="text-2xl">🚜</span>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Tracteurs</p>
              <p className="text-xs text-gray-400">Configuration</p>
            </div>
          </Link>
          <Link to="/admin/config/tools" className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow flex items-center gap-3">
            <span className="text-2xl">🔧</span>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Outils</p>
              <p className="text-xs text-gray-400">Configuration</p>
            </div>
          </Link>
          {isSuperAdmin && (
            <Link to="/admin/users" className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow flex items-center gap-3">
              <span className="text-2xl">👥</span>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Utilisateurs</p>
                <p className="text-xs text-gray-400">Gestion des comptes</p>
              </div>
            </Link>
          )}
        </div>
      )}
    </AppLayout>
  )
}

function StatCard({ label, value, icon, loading }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{icon}</span>
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      </div>
      {loading ? (
        <div className="h-7 w-12 bg-gray-100 animate-pulse rounded" />
      ) : (
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      )}
    </div>
  )
}
