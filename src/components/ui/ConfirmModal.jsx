import { Modal } from './Modal'
import { Button } from './Button'

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Supprimer', loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={loading}>Annuler</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
}
