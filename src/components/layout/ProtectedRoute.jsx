import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LoadingScreen } from '../ui/Spinner'

export function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />

  if (requiredRole) {
    const hierarchy = { driver: 1, admin: 2, superadmin: 3 }
    const userLevel = hierarchy[profile?.role] ?? 0
    const requiredLevel = hierarchy[requiredRole] ?? 0
    if (userLevel < requiredLevel) return <Navigate to="/dashboard" replace />
  }

  return children
}
