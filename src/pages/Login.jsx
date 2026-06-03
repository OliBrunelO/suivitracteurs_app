import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import toast from 'react-hot-toast'
import { Toaster } from 'react-hot-toast'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!username.trim() || !password) return
    setLoading(true)
    try {
      await login(username.trim(), password)
      navigate('/dashboard')
    } catch (err) {
      toast.error('Identifiant ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-100 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🚜</div>
          <h1 className="text-2xl font-bold text-gray-900">Suivi Tracteurs</h1>
          <p className="text-sm text-gray-500 mt-1">Connectez-vous pour continuer</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Identifiant"
            type="text"
            placeholder="votre_identifiant"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoFocus
            autoComplete="username"
            required
          />
          <Input
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <Button type="submit" loading={loading} className="w-full justify-center mt-2">
            Se connecter
          </Button>
        </form>
      </div>
    </div>
  )
}
