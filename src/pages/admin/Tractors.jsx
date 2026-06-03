import { useState } from 'react'
import { AppLayout } from '../../components/layout/AppLayout'
import { useTractors } from '../../hooks/useTractors'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { IconEdit, IconTrash, IconBtn } from '../../components/ui/Icons'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import toast from 'react-hot-toast'

const EMPTY = { name: '', notes: '', active: true }

export default function Tractors() {
  const { tractors, loading, createTractor, updateTractor, deleteTractor } = useTractors()
  const [modal, setModal] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function openCreate() {
    setForm(EMPTY)
    setModal({ mode: 'create' })
  }

  function openEdit(t) {
    setForm({ name: t.name, notes: t.notes ?? '', active: t.active })
    setModal({ mode: 'edit', data: t })
  }

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }))
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Le nom est requis'); return }
    setSaving(true)
    try {
      if (modal.mode === 'create') {
        await createTractor(form)
        toast.success('Tracteur créé')
      } else {
        await updateTractor(modal.data.id, form)
        toast.success('Tracteur modifié')
      }
      setModal(null)
    } catch (err) {
      toast.error(`Erreur : ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await deleteTractor(confirmDelete.id)
      toast.success('Tracteur supprimé')
      setConfirmDelete(null)
    } catch (err) {
      toast.error(`Erreur : ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  async function toggleActive(t) {
    try {
      await updateTractor(t.id, { active: !t.active })
      toast.success(t.active ? 'Tracteur désactivé' : 'Tracteur activé')
    } catch (err) {
      toast.error(`Erreur : ${err.message}`)
    }
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tracteurs</h1>
          <p className="text-sm text-gray-500">Gestion du parc de tracteurs</p>
        </div>
        <Button onClick={openCreate}>+ Ajouter</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : tractors.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Aucun tracteur</div>
        ) : (
          <>
            {/* Cartes — mobile */}
            <div className="md:hidden divide-y divide-gray-100">
              {tractors.map(t => (
                <div key={t.id} className={`flex items-center justify-between gap-3 px-4 py-4 ${!t.active ? 'opacity-60' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm">{t.name}</span>
                      <button onClick={() => toggleActive(t)}>
                        <Badge color={t.active ? 'green' : 'gray'}>{t.active ? 'Actif' : 'Inactif'}</Badge>
                      </button>
                    </div>
                    {t.notes && <p className="text-xs text-gray-400 truncate">{t.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <IconBtn onClick={() => openEdit(t)} title="Modifier" color="primary">
                      <IconEdit />
                    </IconBtn>
                    <IconBtn onClick={() => setConfirmDelete(t)} title="Supprimer" color="red">
                      <IconTrash />
                    </IconBtn>
                  </div>
                </div>
              ))}
            </div>

            {/* Tableau — tablette et desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Nom</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Notes</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Statut</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tractors.map(t => (
                    <tr key={t.id} className={`hover:bg-gray-50 transition-colors ${!t.active ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{t.notes || '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleActive(t)}>
                          <Badge color={t.active ? 'green' : 'gray'}>{t.active ? 'Actif' : 'Inactif'}</Badge>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <IconBtn onClick={() => openEdit(t)} title="Modifier" color="primary">
                            <IconEdit />
                          </IconBtn>
                          <IconBtn onClick={() => setConfirmDelete(t)} title="Supprimer" color="red">
                            <IconTrash />
                          </IconBtn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'create' ? 'Ajouter un tracteur' : 'Modifier le tracteur'}
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nom *"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Ex. : John Deere 6130R"
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={e => set('active', e.target.checked)}
              className="rounded border-gray-300 text-primary-600"
            />
            <span className="text-sm font-medium text-gray-700">Actif</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
            <Button onClick={handleSave} loading={saving}>Enregistrer</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Supprimer le tracteur"
        message={`Supprimer définitivement le tracteur "${confirmDelete?.name}" ?`}
      />
    </AppLayout>
  )
}
