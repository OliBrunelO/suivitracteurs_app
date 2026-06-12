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
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import {
  formatDateTime,
  formatWorkedDuration,
  getWorkStatus,
  buildWorkTimeline,
} from '../../lib/utils'
import toast from 'react-hot-toast'

export default function RecordDetail() {
  const { id } = useParams()
  const { profile, isAdmin } = useAuth()
  const { fetchOne, updateRecord, deleteRecord, pauseRecord, resumeRecord } = useWorkRecords()
  const navigate = useNavigate()

  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pausing, setPausing] = useState(false)
  const [confirm, setConfirm] = useState(null) // { title, message, onConfirm, label }

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

  async function handleUpdate(values, toolIds, pauses) {
    setSaving(true)
    try {
      await updateRecord(id, values, toolIds, pauses)
      toast.success('Modifications enregistrées')
      setEditing(false)
      await load()
    } catch (err) {
      toast.error(`Erreur : ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  function handleDelete() {
    setConfirm({
      title: 'Supprimer ce travail',
      message: 'Cette action est irréversible. Toutes les données associées (pauses, outils) seront supprimées.',
      label: 'Supprimer',
      onConfirm: async () => {
        setDeleting(true)
        try {
          await deleteRecord(id)
          toast.success('Enregistrement supprimé')
          navigate('/records')
        } catch (err) {
          toast.error(`Erreur : ${err.message}`)
          setDeleting(false)
        }
      },
    })
  }

  async function handlePause() {
    setPausing(true)
    try {
      await pauseRecord(id)
      toast.success('Travail mis en pause')
      await load()
    } catch (err) {
      toast.error(`Erreur : ${err.message}`)
    } finally {
      setPausing(false)
    }
  }

  async function handleResume() {
    setPausing(true)
    try {
      await resumeRecord(id)
      toast.success('Travail repris')
      await load()
    } catch (err) {
      toast.error(`Erreur : ${err.message}`)
    } finally {
      setPausing(false)
    }
  }

  function handleEnd() {
    setConfirm({
      title: 'Clôturer ce travail',
      message: `La date et heure de fin sera enregistrée maintenant (${new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}).`,
      label: 'Clôturer',
      onConfirm: async () => {
        setPausing(true)
        try {
          await updateRecord(id, { ended_at: new Date().toISOString() }, undefined, undefined)
          toast.success('Travail clôturé')
          await load()
        } catch (err) {
          toast.error(`Erreur : ${err.message}`)
        } finally {
          setPausing(false)
        }
      },
    })
  }

  if (loading) return <AppLayout><div className="flex justify-center py-20"><Spinner /></div></AppLayout>
  if (!record) return null

  const canEdit = isAdmin || record.driver_id === profile?.id
  const pauses = record.pauses || []
  const status = getWorkStatus(record, pauses)
  const hasTimeline = pauses.length > 0
  const timeline = hasTimeline ? buildWorkTimeline(record, pauses) : []

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
            {/* Bannière de statut */}
            {status === 'en_cours' && (
              <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between gap-2">
                <span className="text-amber-600 text-sm font-medium">⏳ Travail en cours</span>
                {isAdmin && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={handlePause} loading={pausing}>
                      ⏸ Mettre en pause
                    </Button>
                    <Button size="sm" variant="danger" onClick={handleEnd} loading={pausing}>
                      ⏹ Terminer
                    </Button>
                  </div>
                )}
              </div>
            )}
            {status === 'en_pause' && (
              <div className="px-5 py-3 bg-purple-50 border-b border-purple-100 flex items-center justify-between gap-2">
                <span className="text-purple-700 text-sm font-medium">⏸ Travail en pause</span>
                {isAdmin && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={handleResume} loading={pausing}>
                      ▶ Reprendre
                    </Button>
                    <Button size="sm" variant="danger" onClick={handleEnd} loading={pausing}>
                      ⏹ Terminer
                    </Button>
                  </div>
                )}
              </div>
            )}

            <DetailRow label="Début" value={formatDateTime(record.started_at)} />
            <DetailRow
              label="Fin"
              value={
                record.ended_at
                  ? formatDateTime(record.ended_at)
                  : status === 'en_pause'
                    ? <Badge color="purple">⏸ En pause</Badge>
                    : <Badge color="yellow">⏳ En cours</Badge>
              }
            />
            <DetailRow
              label={hasTimeline ? 'Durée travaillée' : 'Durée'}
              value={record.ended_at ? formatWorkedDuration(record, pauses) : '—'}
            />

            {/* Timeline des plages de travail/pause */}
            {hasTimeline && (
              <DetailRow
                label="Plages"
                value={
                  <div className="flex flex-col gap-1.5">
                    {timeline.map((seg, i) => (
                      <div key={i} className={`flex items-center gap-2 text-xs ${seg.type === 'pause' ? 'text-gray-400' : 'text-gray-700'}`}>
                        <span>{seg.type === 'pause' ? '⏸' : '▶'}</span>
                        <span>
                          {formatDateTime(seg.start)}
                          {' → '}
                          {seg.end
                            ? formatDateTime(seg.end)
                            : seg.type === 'pause'
                              ? <Badge color="purple">En pause</Badge>
                              : <Badge color="yellow">En cours</Badge>
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                }
              />
            )}

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
      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={async () => { await confirm.onConfirm(); setConfirm(null) }}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.label}
        loading={deleting || pausing}
      />
    </AppLayout>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex gap-4 px-5 py-3">
      <span className="text-sm font-medium text-gray-500 w-32 shrink-0">{label}</span>
      <div className="text-sm text-gray-900">{value ?? '—'}</div>
    </div>
  )
}
