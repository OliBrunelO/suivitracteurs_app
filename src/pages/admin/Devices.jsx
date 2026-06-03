import { useState } from 'react'
import { AppLayout } from '../../components/layout/AppLayout'
import { useDevices, useAssignmentHistory } from '../../hooks/useDevices'
import { useTractors } from '../../hooks/useTractors'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { IconEdit, IconUnlink, IconHistory, IconBtn } from '../../components/ui/Icons'
import { formatDateTime } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function Devices() {
  const { profile } = useAuth()
  const { devices, loading, createDevice, updateDevice, assignDevice, unassignDevice } = useDevices()
  const { tractors } = useTractors()

  const [tab, setTab] = useState('devices') // 'devices' | 'history'
  const [assignModal, setAssignModal] = useState(null)  // device object
  const [addModal, setAddModal] = useState(false)
  const [historyDevice, setHistoryDevice] = useState(null)

  const [assignForm, setAssignForm] = useState({ tractorId: '', notes: '' })
  const [addForm, setAddForm] = useState({ serial_number: '', notes: '' })
  const [saving, setSaving] = useState(false)

  function openAssign(device) {
    setAssignForm({
      tractorId: device.active_assignment?.tractor_id ?? '',
      notes: '',
    })
    setAssignModal(device)
  }

  async function handleAssign() {
    if (!assignForm.tractorId) { toast.error('Sélectionner un tracteur'); return }
    setSaving(true)
    try {
      await assignDevice(assignModal.id, assignForm.tractorId, profile.id, assignForm.notes)
      toast.success('Boîtier affecté avec succès')
      setAssignModal(null)
    } catch (err) {
      toast.error(`Erreur : ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleUnassign(device) {
    if (!confirm(`Désaffecter le boîtier ${device.serial_number} du tracteur "${device.active_assignment?.tractor?.name}" ?`)) return
    try {
      await unassignDevice(device.active_assignment.id, profile.id)
      toast.success('Boîtier désaffecté')
    } catch (err) {
      toast.error(`Erreur : ${err.message}`)
    }
  }

  async function handleAdd() {
    if (!addForm.serial_number.trim()) { toast.error('Le numéro de série est requis'); return }
    setSaving(true)
    try {
      await createDevice({ serial_number: addForm.serial_number.trim().toUpperCase(), notes: addForm.notes || null })
      toast.success('Boîtier ajouté')
      setAddModal(false)
      setAddForm({ serial_number: '', notes: '' })
    } catch (err) {
      toast.error(err.message.includes('unique') ? 'Ce numéro de série existe déjà' : err.message)
    } finally {
      setSaving(false)
    }
  }

  const assigned   = devices.filter(d => d.active_assignment)
  const unassigned = devices.filter(d => !d.active_assignment)

  const tractorOptions = tractors
    .filter(t => t.active)
    .map(t => ({ value: t.id, label: t.name }))

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Boîtiers GPS</h1>
          <p className="text-sm text-gray-500">
            {assigned.length} affecté{assigned.length > 1 ? 's' : ''} · {unassigned.length} disponible{unassigned.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setAddModal(true)}>+ Ajouter un boîtier</Button>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <TabBtn active={tab === 'devices'} onClick={() => setTab('devices')}>
          Liste des boîtiers
        </TabBtn>
        <TabBtn active={tab === 'history'} onClick={() => setTab('history')}>
          Historique des affectations
        </TabBtn>
      </div>

      {tab === 'devices' && (
        <>
          {loading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Boîtiers affectés */}
              <Section title="Boîtiers affectés" count={assigned.length} color="green">
                {assigned.length === 0 ? (
                  <EmptyRow text="Aucun boîtier affecté" />
                ) : (
                  <DeviceTable
                    devices={assigned}
                    onAssign={openAssign}
                    onUnassign={handleUnassign}
                    onHistory={d => { setHistoryDevice(d); setTab('history') }}
                  />
                )}
              </Section>

              {/* Boîtiers disponibles */}
              <Section title="Boîtiers disponibles (non affectés)" count={unassigned.length} color="gray">
                {unassigned.length === 0 ? (
                  <EmptyRow text="Tous les boîtiers sont affectés" />
                ) : (
                  <DeviceTable
                    devices={unassigned}
                    onAssign={openAssign}
                    onUnassign={handleUnassign}
                    onHistory={d => { setHistoryDevice(d); setTab('history') }}
                  />
                )}
              </Section>
            </div>
          )}
        </>
      )}

      {tab === 'history' && (
        <HistoryTab devices={devices} initialDevice={historyDevice} tractors={tractors} />
      )}

      {/* Modal affectation */}
      <Modal
        open={!!assignModal}
        onClose={() => setAssignModal(null)}
        title="Affecter un boîtier"
      >
        <div className="flex flex-col gap-4">
          <div className="bg-gray-50 rounded-lg px-4 py-3">
            <p className="text-xs text-gray-500 mb-0.5">Boîtier</p>
            <p className="font-mono font-semibold text-gray-800">{assignModal?.serial_number}</p>
            {assignModal?.active_assignment && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠ Actuellement affecté à <strong>{assignModal.active_assignment.tractor?.name}</strong> depuis le {formatDateTime(assignModal.active_assignment.assigned_at)}. L'ancienne affectation sera automatiquement clôturée.
              </p>
            )}
          </div>

          <Select
            label="Tracteur *"
            value={assignForm.tractorId}
            onChange={e => setAssignForm(f => ({ ...f, tractorId: e.target.value }))}
            options={tractorOptions}
            placeholder="Sélectionner un tracteur..."
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Notes (optionnel)</label>
            <textarea
              value={assignForm.notes}
              onChange={e => setAssignForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Raison du changement, observations..."
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <p className="text-xs text-gray-400">
            Date d'affectation : <strong>{new Date().toLocaleString('fr-FR')}</strong> (automatique)
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setAssignModal(null)}>Annuler</Button>
            <Button onClick={handleAssign} loading={saving}>Confirmer l'affectation</Button>
          </div>
        </div>
      </Modal>

      {/* Modal ajout boîtier */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Ajouter un boîtier GPS">
        <div className="flex flex-col gap-4">
          <Input
            label="Numéro de série *"
            value={addForm.serial_number}
            onChange={e => setAddForm(f => ({ ...f, serial_number: e.target.value }))}
            placeholder="Ex. : AZP25280655"
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={addForm.notes}
              onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setAddModal(false)}>Annuler</Button>
            <Button onClick={handleAdd} loading={saving}>Ajouter</Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  )
}

// ─── Sous-composants ────────────────────────────────────────

function DeviceTable({ devices, onAssign, onUnassign, onHistory }) {
  return (
    <>
      {/* Cartes mobile */}
      <div className="md:hidden divide-y divide-gray-100">
        {devices.map(d => (
          <div key={d.id} className="px-4 py-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-mono font-semibold text-sm text-gray-900">{d.serial_number}</span>
              {d.active_assignment ? (
                <Badge color="green">{d.active_assignment.tractor?.name}</Badge>
              ) : (
                <Badge color="gray">Disponible</Badge>
              )}
            </div>
            {d.active_assignment && (
              <p className="text-xs text-gray-400 mb-2">
                Depuis le {formatDateTime(d.active_assignment.assigned_at)}
              </p>
            )}
            <div className="flex items-center gap-1 mt-2">
              <IconBtn onClick={() => onAssign(d)} title={d.active_assignment ? 'Réaffecter' : 'Affecter'} color="primary">
                <IconEdit />
              </IconBtn>
              {d.active_assignment && (
                <IconBtn onClick={() => onUnassign(d)} title="Désaffecter" color="red">
                  <IconUnlink />
                </IconBtn>
              )}
              <IconBtn onClick={() => onHistory(d)} title="Historique" color="gray" className="ml-auto">
                <IconHistory />
              </IconBtn>
            </div>
          </div>
        ))}
      </div>

      {/* Tableau desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <Th>Numéro de série</Th>
              <Th>Tracteur affecté</Th>
              <Th>Depuis le</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {devices.map(d => (
              <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono font-medium text-gray-900">{d.serial_number}</td>
                <td className="px-4 py-3">
                  {d.active_assignment ? (
                    <span className="font-medium text-gray-800">{d.active_assignment.tractor?.name}</span>
                  ) : (
                    <span className="text-gray-400 italic">Non affecté</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {d.active_assignment ? formatDateTime(d.active_assignment.assigned_at) : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <IconBtn onClick={() => onHistory(d)} title="Historique" color="gray">
                      <IconHistory />
                    </IconBtn>
                    <IconBtn onClick={() => onAssign(d)} title={d.active_assignment ? 'Réaffecter' : 'Affecter'} color="primary">
                      <IconEdit />
                    </IconBtn>
                    {d.active_assignment && (
                      <IconBtn onClick={() => onUnassign(d)} title="Désaffecter" color="red">
                        <IconUnlink />
                      </IconBtn>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function HistoryTab({ devices, initialDevice, tractors }) {
  const [deviceFilter, setDeviceFilter] = useState(initialDevice?.id ?? '')
  const [tractorFilter, setTractorFilter] = useState('')

  const { history, loading } = useAssignmentHistory({
    deviceId:  deviceFilter  || undefined,
    tractorId: tractorFilter || undefined,
  })

  const deviceOptions  = devices.map(d => ({ value: d.id, label: d.serial_number }))
  const tractorOptions = tractors.map(t => ({ value: t.id, label: t.name }))

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="w-56">
          <Select
            label="Filtrer par boîtier"
            value={deviceFilter}
            onChange={e => { setDeviceFilter(e.target.value); setTractorFilter('') }}
            options={deviceOptions}
            placeholder="Tous les boîtiers"
          />
        </div>
        <div className="w-48">
          <Select
            label="Filtrer par tracteur"
            value={tractorFilter}
            onChange={e => { setTractorFilter(e.target.value); setDeviceFilter('') }}
            options={tractorOptions}
            placeholder="Tous les tracteurs"
          />
        </div>
        {(deviceFilter || tractorFilter) && (
          <div className="flex items-end">
            <button
              onClick={() => { setDeviceFilter(''); setTractorFilter('') }}
              className="text-xs text-gray-400 hover:text-red-600 pb-2"
            >
              ✕ Réinitialiser
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : history.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Aucun historique trouvé</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Mobile */}
          <div className="md:hidden divide-y divide-gray-100">
            {history.map(h => (
              <div key={h.id} className="px-4 py-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-sm font-semibold text-gray-900">{h.device?.serial_number}</span>
                  {h.unassigned_at ? (
                    <Badge color="gray">Clôturée</Badge>
                  ) : (
                    <Badge color="green">Active</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-700 mb-1">→ <strong>{h.tractor?.name}</strong></p>
                <p className="text-xs text-gray-500">
                  Du {formatDateTime(h.assigned_at)}
                  {h.unassigned_at ? ` au ${formatDateTime(h.unassigned_at)}` : ' · en cours'}
                </p>
                {h.notes && <p className="text-xs text-gray-400 mt-1 italic">{h.notes}</p>}
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <Th>Boîtier</Th>
                  <Th>Tracteur</Th>
                  <Th>Affecté le</Th>
                  <Th>Désaffecté le</Th>
                  <Th>Statut</Th>
                  <Th>Notes</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.map(h => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-gray-900">{h.device?.serial_number}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{h.tractor?.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(h.assigned_at)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {h.unassigned_at ? formatDateTime(h.unassigned_at) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {h.unassigned_at ? (
                        <Badge color="gray">Clôturée</Badge>
                      ) : (
                        <Badge color="green">Active</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">
                      {h.notes ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, count, color, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50">
        <span className="font-semibold text-gray-700 text-sm">{title}</span>
        <Badge color={color}>{count}</Badge>
      </div>
      {children}
    </div>
  )
}

function EmptyRow({ text }) {
  return <div className="text-center py-8 text-gray-400 text-sm">{text}</div>
}

function Th({ children }) {
  return <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{children}</th>
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-primary-600 text-primary-700'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {children}
    </button>
  )
}
