import { useState } from 'react'
import { AppLayout } from '../../components/layout/AppLayout'
import { useCategories } from '../../hooks/useCategories'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { Spinner } from '../../components/ui/Spinner'
import { IconEdit, IconTrash, IconBtn } from '../../components/ui/Icons'
import toast from 'react-hot-toast'

export default function Categories() {
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useCategories()
  const [modal, setModal] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function openCreate() {
    setName('')
    setModal({ mode: 'create' })
  }

  function openEdit(c) {
    setName(c.name)
    setModal({ mode: 'edit', data: c })
  }

  async function handleSave() {
    if (!name.trim()) { toast.error('Le nom est requis'); return }
    setSaving(true)
    try {
      if (modal.mode === 'create') {
        await createCategory({ name: name.trim() })
        toast.success('Catégorie créée')
      } else {
        await updateCategory(modal.data.id, { name: name.trim() })
        toast.success('Catégorie modifiée')
      }
      setModal(null)
    } catch (err) {
      toast.error(err.message.includes('unique') ? 'Ce nom existe déjà' : err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await deleteCategory(confirmDelete.id)
      toast.success('Catégorie supprimée')
      setConfirmDelete(null)
    } catch (err) {
      toast.error(`Erreur : ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catégories d'outils</h1>
          <p className="text-sm text-gray-500">{categories.length} catégorie{categories.length > 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openCreate}>+ Ajouter</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="mb-3">Aucune catégorie définie</p>
            <Button size="sm" onClick={openCreate}>Créer la première catégorie</Button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {categories.map(c => (
              <li key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                <span className="font-medium text-gray-800">{c.name}</span>
                <div className="flex gap-1">
                  <IconBtn onClick={() => openEdit(c)} title="Modifier" color="primary">
                    <IconEdit />
                  </IconBtn>
                  <IconBtn onClick={() => setConfirmDelete(c)} title="Supprimer" color="red">
                    <IconTrash />
                  </IconBtn>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'create' ? 'Nouvelle catégorie' : 'Modifier la catégorie'}
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nom *"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex. : Travail du sol, Tonte, Traitement..."
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
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
        title="Supprimer la catégorie"
        message={`Supprimer "${confirmDelete?.name}" ? Les outils associés ne seront pas supprimés, mais perdront cette catégorie.`}
      />
    </AppLayout>
  )
}
