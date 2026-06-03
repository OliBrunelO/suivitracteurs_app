import { Link } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout'
import { useAuth } from '../../context/AuthContext'

export default function AdminConfig() {
  const { isAdmin, isSuperAdmin } = useAuth()

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
        <p className="text-sm text-gray-500">Gestion de l'application</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Accessible à admin ET superadmin */}
        {isAdmin && (
          <>
            <ConfigCard
              to="/admin/config/tractors"
              icon="🚜"
              title="Tracteurs"
              description="Gérer le parc de tracteurs, activation/désactivation"
            />
            <ConfigCard
              to="/admin/config/tools"
              icon="🔧"
              title="Outils"
              description="Gérer les outils agricoles disponibles à la saisie"
            />
            <ConfigCard
              to="/admin/devices"
              icon="📡"
              title="Boîtiers GPS"
              description="Affecter les boîtiers aux tracteurs, consulter l'historique"
            />
          </>
        )}
        <ConfigCard
          to="/records"
          icon="📋"
          title="Tous les travaux"
          description="Consulter et filtrer l'ensemble des travaux enregistrés"
        />
        {/* Accessible à superadmin uniquement */}
        {isSuperAdmin && (
          <>
            <ConfigCard
              to="/admin/categories"
              icon="🏷️"
              title="Catégories"
              description="Définir les catégories d'outils (superadmin uniquement)"
            />
            <ConfigCard
              to="/admin/users"
              icon="👥"
              title="Utilisateurs"
              description="Gérer les comptes, modifier les rôles (superadmin uniquement)"
            />
          </>
        )}
      </div>
    </AppLayout>
  )
}

function ConfigCard({ to, icon, title, description }) {
  return (
    <Link
      to={to}
      className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-primary-300 transition-all flex items-start gap-4"
    >
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
    </Link>
  )
}
