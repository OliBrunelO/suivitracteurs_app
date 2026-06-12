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
  const { tractors, loading: loadingTractors, error: errorTractors } = useTractors({ activeOnly: true })
  const { tools, loading: loadingTools, error: errorTools } = useTools({ activeOnly: true })
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
  const [localPauses, setLocalPauses] = useState(
    initialData?.pauses?.map(p => ({
      paused_at:  toLocalDatetimeValue(p.paused_at),
      resumed_at: toLocalDatetimeValue(p.resumed_at),
    })) ?? []
  )
  const [errors, setErrors] = useState({})
  const [pauseErrors, setPauseErrors] = useState([])

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

  function addPause() {
    setLocalPauses(prev => [...prev, { paused_at: '', resumed_at: '' }])
    setPauseErrors(prev => [...prev, {}])
  }

  function updatePause(index, field, value) {
    setLocalPauses(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
    setPauseErrors(prev => prev.map((e, i) => i === index ? { ...e, [field]: undefined } : e))
  }

  function removePause(index) {
    setLocalPauses(prev => prev.filter((_, i) => i !== index))
    setPauseErrors(prev => prev.filter((_, i) => i !== index))
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

  function validatePauses() {
    const errs = localPauses.map(p => {
      const e = {}
      if (!p.paused_at) {
        e.paused_at = 'Requis'
      } else {
        if (form.started_at && new Date(p.paused_at) <= new Date(form.started_at))
          e.paused_at = 'Doit être après le début'
        if (p.resumed_at && new Date(p.resumed_at) <= new Date(p.paused_at))
          e.resumed_at = 'Reprise doit être après la pause'
      }
      return e
    })
    setPauseErrors(errs)
    return errs.some(e => Object.keys(e).length > 0)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    const hasPauseErrors = validatePauses()
    if (Object.keys(errs).length > 0 || hasPauseErrors) { setErrors(errs); return }

    const pausesData = localPauses
      .filter(p => p.paused_at)
      .map(p => ({
        paused_at:  new Date(p.paused_at).toISOString(),
        resumed_at: p.resumed_at ? new Date(p.resumed_at).toISOString() : null,
      }))

    onSubmit(
      {
        ...form,
        driver_id:  isAdmin ? form.driver_id : profile.id,
        created_by: profile.id,
        started_at: new Date(form.started_at).toISOString(),
        ended_at:   form.ended_at ? new Date(form.ended_at).toISOString() : null,
      },
      toolIds,
      pausesData,
    )
  }

  const tractorOptions = tractors.map(t => ({ value: t.id, label: t.name }))
  const driverOptions  = drivers.map(d => ({ value: d.id, label: d.full_name }))

  const toolOptions = tools.map(t => ({
    value: t.id,
    label: t.name,
    group: t.category?.name ?? 'Sans catégorie',
  }))

  const dataError = errorTractors || errorTools
  if (dataError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
        <p className="font-semibold mb-1">Impossible de charger les données du formulaire</p>
        <p className="text-xs font-mono">{dataError}</p>
        <button
          type="button"
          className="mt-3 text-primary-600 underline text-xs"
          onClick={() => window.location.reload()}
        >
          Recharger la page
        </button>
      </div>
    )
  }

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

      {/* Pauses — admin uniquement, édition uniquement */}
      {isAdmin && initialData && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Pauses</span>
            <button
              type="button"
              onClick={addPause}
              className="text-xs text-primary-600 hover:underline"
            >
              + Ajouter une pause
            </button>
          </div>

          {localPauses.length === 0 && (
            <p className="text-xs text-gray-400 mb-2">Aucune pause enregistrée</p>
          )}

          {localPauses.map((pause, i) => (
            <div key={i} className="grid grid-cols-2 gap-3 mb-3 items-start">
              <Input
                label={`Pause ${i + 1} — Mise en pause`}
                type="datetime-local"
                value={pause.paused_at}
                onChange={e => updatePause(i, 'paused_at', e.target.value)}
                error={pauseErrors[i]?.paused_at}
              />
              <div className="flex gap-1 items-end">
                <div className="flex-1">
                  <Input
                    label="Reprise"
                    type="datetime-local"
                    value={pause.resumed_at}
                    onChange={e => updatePause(i, 'resumed_at', e.target.value)}
                    error={pauseErrors[i]?.resumed_at}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removePause(i)}
                  className="mb-0.5 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Supprimer cette pause"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
