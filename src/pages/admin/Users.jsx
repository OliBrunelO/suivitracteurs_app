import { useState, useEffect } from 'react'
import { AppLayout } from '../../components/layout/AppLayout'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { IconEdit, IconBtn } from '../../components/ui/Icons'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const roleColors = { superadmin: 'purple', admin: 'blue', driver: 'green' }
const roleLabels = { superadmin: 'Super Admin', admin: 'Admin (chef d\'équipe)', driver: 'Chauffeur' }

export default function Users() {
  const { profile: myProfile } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editModal, setEditModal] = useState(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [form, setForm] = useState({ full_name: '', role: 'driver' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name')
    if (error) toast.error('Impossible de charger les utilisateurs')
    else setUsers(data || [])
    setLoading(false)
  }

  function openEdit(u) {
    setForm({ full_name: u.full_name, role: u.role })
    setEditModal(u)
  }

  async function handleSave() {
    if (!form.full_name.trim()) { toast.error('Le nom est requis'); return }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: form.full_name, role: form.role })
        .eq('id', editModal.id)
      if (error) throw error
      toast.success('Utilisateur mis à jour')
      setEditModal(null)
      await loadUsers()
    } catch (err) {
      toast.error(`Erreur : ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-sm text-gray-500">{users.length} compte{users.length > 1 ? 's' : ''} enregistré{users.length > 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setHelpOpen(true)}>+ Créer un compte</Button>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Aucun utilisateur</div>
        ) : (
          <>
            {/* Cartes mobile */}
            <div className="md:hidden divide-y divide-gray-100">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-gray-900">{u.full_name}</span>
                      {u.id === myProfile?.id && <span className="text-xs text-gray-400">(vous)</span>}
                    </div>
                    <p className="text-xs text-gray-500 font-mono mb-1">@{u.username}</p>
                    <Badge color={roleColors[u.role] ?? 'gray'}>{roleLabels[u.role] ?? u.role}</Badge>
                  </div>
                  <IconBtn onClick={() => openEdit(u)} title="Modifier" color="primary">
                    <IconEdit />
                  </IconBtn>
                </div>
              ))}
            </div>

            {/* Tableau tablette/desktop */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <Th>Nom complet</Th>
                    <Th>Identifiant</Th>
                    <Th>Rôle</Th>
                    <Th>Créé le</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {u.full_name}
                        {u.id === myProfile?.id && <span className="ml-2 text-xs text-gray-400">(vous)</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">@{u.username}</td>
                      <td className="px-4 py-3">
                        <Badge color={roleColors[u.role] ?? 'gray'}>{roleLabels[u.role] ?? u.role}</Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(u.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <IconBtn onClick={() => openEdit(u)} title="Modifier" color="primary">
                          <IconEdit />
                        </IconBtn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal modifier rôle/nom */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Modifier l'utilisateur">
        <div className="flex flex-col gap-4">
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm">
            <p className="text-gray-500">Identifiant</p>
            <p className="font-mono font-semibold text-gray-800">@{editModal?.username}</p>
          </div>
          <Input
            label="Nom complet"
            value={form.full_name}
            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
          />
          <Select
            label="Rôle"
            value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
            options={[
              { value: 'driver',     label: 'Chauffeur — saisie de ses propres travaux' },
              { value: 'admin',      label: 'Admin — chef d\'équipe, config tracteurs/outils' },
              { value: 'superadmin', label: 'Super Admin — accès total' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setEditModal(null)}>Annuler</Button>
            <Button onClick={handleSave} loading={saving}>Enregistrer</Button>
          </div>
        </div>
      </Modal>

      {/* Modal aide création compte */}
      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Créer un nouveau compte" size="lg">
        <div className="flex flex-col gap-5 text-sm">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-800 text-xs">
            La création de compte se fait en 2 étapes dans Supabase (mesure de sécurité — le mot de passe ne transite jamais par l'application).
          </div>

          <StepBlock number="1" title="Créer le compte dans Supabase Dashboard">
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Ouvrir <strong>Supabase Dashboard → Authentication → Users</strong></li>
              <li>Cliquer sur <strong>"Add user"</strong></li>
              <li>Renseigner :
                <ul className="mt-1 ml-4 space-y-1 list-disc text-gray-500">
                  <li><strong>Email :</strong> <code className="bg-gray-100 px-1 rounded">identifiant@internal.app</code><br/>
                    <span className="text-xs">ex. pour l'identifiant <em>jean.dupont</em> → <code className="bg-gray-100 px-1 rounded">jean.dupont@internal.app</code></span>
                  </li>
                  <li><strong>Password :</strong> choisir un mot de passe</li>
                  <li>Cocher <strong>"Auto confirm user"</strong></li>
                </ul>
              </li>
              <li>Cliquer sur <strong>"Create user"</strong></li>
            </ol>
          </StepBlock>

          <StepBlock number="2" title="Définir le nom et le rôle dans cette page">
            <p className="text-gray-600">
              Le compte apparaît automatiquement dans la liste ci-dessus (avec l'identifiant extrait de l'email). Cliquez sur <strong>Modifier</strong> pour renseigner le nom complet et choisir le rôle.
            </p>
          </StepBlock>

          <StepBlock number="3" title="Communiquer les identifiants au nouvel utilisateur">
            <p className="text-gray-600">Transmettre uniquement :</p>
            <ul className="mt-1 ml-4 list-disc text-gray-500 space-y-1">
              <li><strong>Identifiant :</strong> la partie avant <code className="bg-gray-100 px-1 rounded">@internal.app</code></li>
              <li><strong>Mot de passe :</strong> celui choisi à l'étape 1</li>
            </ul>
            <p className="mt-2 text-gray-500">L'utilisateur se connecte sur la page de login avec ces deux informations — il ne voit jamais l'adresse email.</p>
          </StepBlock>

          <div className="border-t pt-4">
            <p className="font-medium text-gray-700 mb-2">Résumé des rôles</p>
            <div className="space-y-2">
              <RoleRow role="Chauffeur" color="green" desc="Saisit et consulte uniquement ses propres travaux." />
              <RoleRow role="Admin" color="blue" desc="Saisit pour n'importe quel chauffeur. Gère les tracteurs et les outils." />
              <RoleRow role="Super Admin" color="purple" desc="Accès total + gestion des comptes utilisateurs." />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => setHelpOpen(false)}>Fermer</Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  )
}

function Th({ children }) {
  return <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{children}</th>
}

function StepBlock({ number, title, children }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-7 h-7 rounded-full bg-primary-600 text-white text-sm font-bold flex items-center justify-center">
        {number}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-gray-800 mb-2">{title}</p>
        {children}
      </div>
    </div>
  )
}

function RoleRow({ role, color, desc }) {
  return (
    <div className="flex items-start gap-2">
      <Badge color={color} className="shrink-0 mt-0.5">{role}</Badge>
      <span className="text-gray-600 text-xs">{desc}</span>
    </div>
  )
}
