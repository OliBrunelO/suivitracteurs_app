import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTractors } from '../../hooks/useTractors'
import { useTools } from '../../hooks/useTools'
import { supabase } from '../../lib/supabase'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { MultiSelect } from '../ui/MultiSelect'
import { Button } from '../ui/Button'
import { toLocalDatetimeValue } from '../../lib/utils'

export function WorkRecordForm({ initialData, onSubmit, onCancel, loading }) {
  const { profile, isAdmin } = useAuth()
  const { tractors } = useTractors({ activeOnly: true })
  const { tools } = useTools({ activeOnly: true })
  const [drivers, setDrivers] = useState([])

  const [form, setForm] = useState({
    started_at: initialData ? toLocalDatetimeValue(initialData.started_at) : '',
    ended_at:   initialData ? toLocalDatetimeValue(initialData.ended_at)   : '',
    tractor_id: initialData?.tractor_id ?? '',
    driver_id:  initialData?.driver_id  ?? (isAdmin ? '' : profile?.id ?? ''),
    notes:      initialData?.notes ?? '',
  })
  const [toolIds, setToolIds] = useState(
    initialData?.work_record_tools?.map(wrt => wrt.tool_id) ?? []
  )
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isAdmin) {
      supabase
        .from('profiles')
        .select('id, full_name, username')
        .eq('role', 'driver')
        .order('full_name')
        .then(({ data }) => setDrivers(data || []))
    }
  }, [isAdmin])

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }))
    setErrors(e => ({ ...e, [field]: undefined }))
  }

  function validate() {
    const errs = {}
    if (!form.started_at) errs.started_at = 'Requis'
    if (form.started_at && form.ended_at && new Date(form.ended_at) <= new Date(form.started_at))
      errs.ended_at = 'La date de fin doit être après la date de début'
    if (!form.tractor_id) errs.tractor_id = 'Requis'
    if (toolIds.length === 0) errs.toolIds = 'Au moins un outil requis'
    if (isAdmin && !form.driver_id) errs.driver_id = 'Requis'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    onSubmit(
      {
        ...form,
        driver_id:  isAdmin ? form.driver_id : profile.id,
        created_by: profile.id,
        started_at: new Date(form.started_at).toISOString(),
        ended_at:   form.ended_at ? new Date(form.ended_at).toISOString() : null,
      },
      toolIds
    )
  }

  const tractorOptions = tractors.map(t => ({ value: t.id, label: t.name }))
  const driverOptions  = drivers.map(d => ({ value: d.id, label: d.full_name }))

  // Grouper les outils par catégorie pour le MultiSelect
  const toolOptions = tools.map(t => ({
    value: t.id,
    label: t.name,
    group: t.category?.name ?? 'Sans catégorie',
  }))

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Date et heure de début *"
          type="datetime-local"
          value={form.started_at}
          onChange={e => set('started_at', e.target.value)}
          error={errors.started_at}
        />
        <div className="flex flex-col gap-1">
          <Input
            label="Date et heure de fin"
            type="datetime-local"
            value={form.ended_at}
            onChange={e => set('ended_at', e.target.value)}
            error={errors.ended_at}
          />
          {!form.ended_at && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <span>⏳</span> Laisser vide = travail en cours
            </p>
          )}
        </div>
      </div>

      <Select
        label="Tracteur *"
        value={form.tractor_id}
        onChange={e => set('tractor_id', e.target.value)}
        options={tractorOptions}
        placeholder="Sélectionner un tracteur..."
        error={errors.tractor_id}
      />

      <MultiSelect
        label="Outils utilisés *"
        options={toolOptions}
        value={toolIds}
        onChange={ids => { setToolIds(ids); setErrors(e => ({ ...e, toolIds: undefined })) }}
        placeholder="Sélectionner les outils..."
        error={errors.toolIds}
      />

      {isAdmin && (
        <Select
          label="Chauffeur *"
          value={form.driver_id}
          onChange={e => set('driver_id', e.target.value)}
          options={driverOptions}
          placeholder="Sélectionner un chauffeur..."
          error={errors.driver_id}
        />
      )}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Notes</label>
        <textarea
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          rows={3}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Observations, conditions, parcelle..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" loading={loading}>
          {initialData ? 'Enregistrer les modifications' : 'Créer le travail'}
        </Button>
      </div>
    </form>
  )
}
