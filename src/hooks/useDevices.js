import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useDevices() {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetch() {
    setLoading(true)
    // Chaque boîtier avec son affectation active (si elle existe)
    const { data, error } = await supabase
      .from('devices')
      .select(`
        *,
        active_assignment:device_assignments(
          id, assigned_at, tractor_id,
          tractor:tractors(id, name)
        )
      `)
      .is('device_assignments.unassigned_at', null)
      .order('serial_number')

    if (error) { setError(error.message); setLoading(false); return }

    // Aplatir : active_assignment est un tableau, on prend le premier élément
    const flat = (data || []).map(d => ({
      ...d,
      active_assignment: d.active_assignment?.[0] ?? null,
    }))
    setDevices(flat)
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  async function createDevice(values) {
    const { error } = await supabase.from('devices').insert(values)
    if (error) throw error
    await fetch()
  }

  async function updateDevice(id, values) {
    const { error } = await supabase.from('devices').update(values).eq('id', id)
    if (error) throw error
    await fetch()
  }

  // Affecter un boîtier à un tracteur
  // Si le boîtier était déjà affecté, clôture l'ancienne affectation d'abord
  async function assignDevice(deviceId, tractorId, userId, notes = '') {
    // Clôturer l'affectation active existante pour CE boîtier (s'il y en a une)
    await supabase
      .from('device_assignments')
      .update({ unassigned_at: new Date().toISOString(), unassigned_by: userId })
      .eq('device_id', deviceId)
      .is('unassigned_at', null)

    // Clôturer aussi l'affectation active du TRACTEUR cible (s'il avait déjà un boîtier)
    const { data: existingForTractor } = await supabase
      .from('device_assignments')
      .select('id, device_id')
      .eq('tractor_id', tractorId)
      .is('unassigned_at', null)
      .maybeSingle()

    if (existingForTractor) {
      await supabase
        .from('device_assignments')
        .update({ unassigned_at: new Date().toISOString(), unassigned_by: userId })
        .eq('id', existingForTractor.id)
    }

    // Créer la nouvelle affectation
    const { error } = await supabase.from('device_assignments').insert({
      device_id:   deviceId,
      tractor_id:  tractorId,
      assigned_at: new Date().toISOString(),
      assigned_by: userId,
      notes:       notes || null,
    })
    if (error) throw error
    await fetch()
  }

  // Désaffecter un boîtier (sans le réaffecter)
  async function unassignDevice(assignmentId, userId) {
    const { error } = await supabase
      .from('device_assignments')
      .update({ unassigned_at: new Date().toISOString(), unassigned_by: userId })
      .eq('id', assignmentId)
    if (error) throw error
    await fetch()
  }

  return { devices, loading, error, refetch: fetch, createDevice, updateDevice, assignDevice, unassignDevice }
}

// Hook dédié à l'historique des affectations d'un boîtier ou d'un tracteur
export function useAssignmentHistory({ deviceId, tractorId } = {}) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!deviceId && !tractorId) { setLoading(false); return }
    let q = supabase
      .from('device_assignments')
      .select(`
        *,
        device:devices(serial_number),
        tractor:tractors(name),
        assigner:profiles!device_assignments_assigned_by_fkey(full_name),
        unassigner:profiles!device_assignments_unassigned_by_fkey(full_name)
      `)
      .order('assigned_at', { ascending: false })

    if (deviceId)  q = q.eq('device_id',  deviceId)
    if (tractorId) q = q.eq('tractor_id', tractorId)

    q.then(({ data }) => { setHistory(data || []); setLoading(false) })
  }, [deviceId, tractorId])

  return { history, loading }
}
