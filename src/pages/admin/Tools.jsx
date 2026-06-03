import { useState } from 'react'
import { AppLayout } from '../../components/layout/AppLayout'
import { useTools } from '../../hooks/useTools'
import { useCategories } from '../../hooks/useCategories'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { IconEdit, IconTrash, IconBtn } from '../../components/ui/Icons'
import toast from 'react-hot-toast'

const EMPTY = { name: '', category_id: '', active: true }

export default function Tools() {
  const { tools, loading, createTool, updateTool, deleteTool } = useTools()
  const { categories } = useCategories()
  const { isSuperAdmin } = useAuth()

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
    setForm({ name: t.name, category_id: t.category_id ?? '', active: t.active })
    setModal({ mode: 'edit', data: t })
  }

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }))
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Le nom est requis'); return }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        category_id: form.category_id || null,
        active: form.active,
      }
      if (modal.mode === 'create') {
        await createTool(payload)
        toast.success('Outil créé')
      } else {
        await updateTool(modal.data.id, payload)
        toast.success('Outil modifié')
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
      await deleteTool(confirmDelete.id)
      toast.success('Outil supprimé')
      setConfirmDelete(null)
    } catch (err) {
      toast.error(`Erreur : ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  async function toggleActive(t) {
    try {
      await updateTool(t.id, { active: !t.active })
      toast.success(t.active ? 'Outil désactivé' : 'Outil activé')
    } catch (err) {
      toast.error(`Erreur : ${err.message}`)
    }
  }

  // Grouper les outils par catégorie
  const grouped = tools.reduce((acc, t) => {
    const key = t.category?.name ?? '— Sans catégorie'
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {})

  // Trier : catégories nommées en premier, "Sans catégorie" en dernier
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    if (a === '— Sans catégorie') return 1
    if (b === '— Sans catégorie') return -1
    return a.localeCompare(b, 'fr')
  })

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }))

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outils</h1>
          <p className="text-sm text-gray-500">{tools.filter(t => t.active).length} actif{tools.filter(t => t.active).length > 1 ? 's' : ''} · {tools.length} total</p>
        </div>
        <Button onClick={openCreate}>+ Ajouter</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : tools.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-16 text-gray-400">Aucun outil</div>
      ) : (
        <div className="flex flex-col gap-4">
          {sortedKeys.map(catName => (
            <div key={catName} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* En-tête catégorie */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50">
                <span className="font-semibold text-gray-700 text-sm">{catName}</span>
                <span className="text-xs text-gray-400">{grouped[catName].length} outil{grouped[catName].length > 1 ? 's' : ''}</span>
              </div>

              {/* Cartes mobile */}
              <div className="md:hidden divide-y divide-gray-100">
                {grouped[catName].map(t => (
                  <div key={t.id} className={`flex items-center justify-between gap-3 px-4 py-4 ${!t.active ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">{t.name}</span>
                      <button onClick={() => toggleActive(t)}>
                        <Badge color={t.active ? 'green' : 'gray'}>{t.active ? 'Actif' : 'Inactif'}</Badge>
                      </button>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <IconBtn onClick={() => openEdit(t)} title="Modifier" color="primary"><IconEdit /></IconBtn>
                      <IconBtn onClick={() => setConfirmDelete(t)} title="Supprimer" color="red"><IconTrash /></IconBtn>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tableau desktop */}
              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2">Nom</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2">Statut</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {grouped[catName].map(t => (
                      <tr key={t.id} className={`hover:bg-gray-50 transition-colors ${!t.active ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{t.name}</td>
                        <td className="px-4 py-2.5">
                          <button onClick={() => toggleActive(t)}>
                            <Badge color={t.active ? 'green' : 'gray'}>{t.active ? 'Actif' : 'Inactif'}</Badge>
                          </button>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1 justify-end">
                            <IconBtn onClick={() => openEdit(t)} title="Modifier" color="primary"><IconEdit /></IconBtn>
                            <IconBtn onClick={() => setConfirmDelete(t)} title="Supprimer" color="red"><IconTrash /></IconBtn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal ajouter/modifier */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'create' ? 'Ajouter un outil' : "Modifier l'outil"}
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nom *"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Ex. : Broyage, Rognage..."
          />
          <Select
            label="Catégorie"
            value={form.category_id}
            onChange={e => set('category_id', e.target.value)}
            options={categoryOptions}
            placeholder="Sans catégorie"
          />
          {categoryOptions.length === 0 && (
            <p className="text-xs text-amber-600">
              Aucune catégorie disponible.{isSuperAdmin && ' Créez-en depuis Administration → Catégories.'}
            </p>
          )}
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
        title="Supprimer l'outil"
        message={`Supprimer définitivement l'outil "${confirmDelete?.name}" ?`}
      />
    </AppLayout>
  )
}
