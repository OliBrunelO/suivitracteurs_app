import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout'
import { WorkRecordForm } from '../../components/forms/WorkRecordForm'
import { useWorkRecords } from '../../hooks/useWorkRecords'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { IconEdit, IconTrash, IconBtn } from '../../components/ui/Icons'
import { formatDateTime, formatDuration } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function RecordDetail() {
  const { id } = useParams()
  const { profile, isAdmin } = useAuth()
  const { fetchOne, updateRecord, deleteRecord } = useWorkRecords()
  const navigate = useNavigate()

  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    try {
      const data = await fetchOne(id)
      setRecord(data)
    } catch {
      toast.error('Enregistrement introuvable')
      navigate('/records')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate(values, toolIds) {
    setSaving(true)
    try {
      await updateRecord(id, values, toolIds)
      toast.success('Modifications enregistrées')
      setEditing(false)
      await load()
    } catch (err) {
      toast.error(`Erreur : ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Supprimer cet enregistrement ? Cette action est irréversible.')) return
    setDeleting(true)
    try {
      await deleteRecord(id)
      toast.success('Enregistrement supprimé')
      navigate('/records')
    } catch (err) {
      toast.error(`Erreur : ${err.message}`)
      setDeleting(false)
    }
  }

  if (loading) return <AppLayout><div className="flex justify-center py-20"><Spinner /></div></AppLayout>
  if (!record) return null

  const canEdit = isAdmin || record.driver_id === profile?.id

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/records" className="text-sm text-gray-500 hover:text-gray-700">← Retour à la liste</Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Détail du travail</h1>
          </div>
          {canEdit && !editing && (
            <div className="flex items-center gap-1">
              <IconBtn onClick={() => setEditing(true)} title="Modifier" color="primary">
                <IconEdit className="w-5 h-5" />
              </IconBtn>
              {isAdmin && (
                <IconBtn onClick={handleDelete} title="Supprimer" color="red">
                  {deleting
                    ? <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : <IconTrash className="w-5 h-5" />
                  }
                </IconBtn>
              )}
            </div>
          )}
        </div>

        {editing ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <WorkRecordForm
              initialData={record}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(false)}
              loading={saving}
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
            {!record.ended_at && (
              <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                <span className="text-amber-600 text-sm font-medium">⏳ Travail en cours — date de fin non renseignée</span>
              </div>
            )}
            <DetailRow label="Début" value={formatDateTime(record.started_at)} />
            <DetailRow
              label="Fin"
              value={record.ended_at
                ? formatDateTime(record.ended_at)
                : <Badge color="yellow">En cours</Badge>
              }
            />
            <DetailRow
              label="Durée"
              value={record.ended_at ? formatDuration(record.started_at, record.ended_at) : '—'}
            />
            <DetailRow label="Tracteur" value={record.tractor?.name} />
            <DetailRow
              label="Outils"
              value={
                <div className="flex flex-wrap gap-1">
                  {record.work_record_tools?.map(wrt => (
                    <Badge key={wrt.tool_id} color="gray">{wrt.tool?.name}</Badge>
                  ))}
                </div>
              }
            />
            <DetailRow label="Chauffeur" value={record.driver?.full_name} />
            <DetailRow label="Saisi par" value={record.created_by_profile?.full_name} />
            {record.notes && <DetailRow label="Notes" value={record.notes} />}
            <DetailRow label="Créé le" value={formatDateTime(record.created_at)} />
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex gap-4 px-5 py-3">
      <span className="text-sm font-medium text-gray-500 w-32 shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value ?? '—'}</span>
    </div>
  )
}
