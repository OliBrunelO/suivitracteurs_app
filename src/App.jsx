import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'

import Login       from './pages/Login'
import Dashboard   from './pages/Dashboard'
import RecordList  from './pages/records/List'
import NewRecord   from './pages/records/New'
import RecordDetail from './pages/records/Detail'
import AdminConfig  from './pages/admin/Config'
import Tractors     from './pages/admin/Tractors'
import Tools        from './pages/admin/Tools'
import Users        from './pages/admin/Users'
import Devices      from './pages/admin/Devices'
import Categories   from './pages/admin/Categories'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />

          <Route path="/records" element={
            <ProtectedRoute><RecordList /></ProtectedRoute>
          } />
          <Route path="/records/new" element={
            <ProtectedRoute><NewRecord /></ProtectedRoute>
          } />
          <Route path="/records/:id" element={
            <ProtectedRoute><RecordDetail /></ProtectedRoute>
          } />

          {/* admin et superadmin : accès à la config tracteurs/outils */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin"><AdminConfig /></ProtectedRoute>
          } />
          <Route path="/admin/config" element={
            <ProtectedRoute requiredRole="admin"><AdminConfig /></ProtectedRoute>
          } />
          <Route path="/admin/config/tractors" element={
            <ProtectedRoute requiredRole="admin"><Tractors /></ProtectedRoute>
          } />
          <Route path="/admin/config/tools" element={
            <ProtectedRoute requiredRole="admin"><Tools /></ProtectedRoute>
          } />

          {/* admin ET superadmin : gestion des boîtiers GPS */}
          <Route path="/admin/devices" element={
            <ProtectedRoute requiredRole="admin"><Devices /></ProtectedRoute>
          } />

          {/* superadmin uniquement : catégories et utilisateurs */}
          <Route path="/admin/categories" element={
            <ProtectedRoute requiredRole="superadmin"><Categories /></ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requiredRole="superadmin"><Users /></ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
