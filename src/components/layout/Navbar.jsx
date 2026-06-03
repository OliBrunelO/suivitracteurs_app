import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Badge } from '../ui/Badge'

const roleColors = { superadmin: 'purple', admin: 'blue', driver: 'green' }
const roleLabels = { superadmin: 'Super Admin', admin: 'Admin', driver: 'Chauffeur' }

export function Navbar() {
  const { profile, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`

  const mobileLinkClass = ({ isActive }) =>
    `block px-4 py-3 text-base font-medium rounded-lg transition-colors ${
      isActive ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
    }`

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🚜</span>
            <span className="font-bold text-gray-900 text-sm hidden sm:block">Suivi Tracteurs</span>
          </Link>

          {/* Liens desktop */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/dashboard" className={linkClass}>Accueil</NavLink>
            <NavLink to="/records" className={linkClass}>Travaux</NavLink>
            {isAdmin && <NavLink to="/admin" className={linkClass}>Administration</NavLink>}
          </div>

          {/* Droite desktop */}
          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm text-gray-600">{profile?.full_name}</span>
            <Badge color={roleColors[profile?.role] ?? 'gray'}>
              {roleLabels[profile?.role] ?? profile?.role}
            </Badge>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              Déconnexion
            </button>
          </div>

          {/* Burger — mobile */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Menu déroulant mobile */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2" onClick={() => setMenuOpen(false)}>
          <div className="flex flex-col gap-1 mb-4">
            <NavLink to="/dashboard" className={mobileLinkClass}>🏠 Accueil</NavLink>
            <NavLink to="/records" className={mobileLinkClass}>📋 Travaux</NavLink>
            {isAdmin && <NavLink to="/admin" className={mobileLinkClass}>⚙️ Administration</NavLink>}
          </div>
          <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
              <Badge color={roleColors[profile?.role] ?? 'gray'} className="mt-1">
                {roleLabels[profile?.role] ?? profile?.role}
              </Badge>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
