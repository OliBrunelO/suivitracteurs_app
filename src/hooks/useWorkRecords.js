import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useWorkRecords(filters = {}) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 20

  const { page = 1, dateFrom, dateTo, tractorId, driverId, toolId } = filters

  async function fetch() {
    setLoading(true)
    let query = supabase
      .from('work_records')
      .select(`
        *,
        tractor:tractors(id, name, gps_device_id),
        driver:profiles!work_records_driver_id_fkey(id, full_name, username),
        created_by_profile:profiles!work_records_created_by_fkey(id, full_name, username),
        work_record_tools(tool_id, tool:tools(id, name)),
        work_record_pauses(id, paused_at, resumed_at)
      `, { count: 'exact' })
      .order('started_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (dateFrom) query = query.gte('started_at', dateFrom)
    if (dateTo)   query = query.lte('started_at', dateTo + 'T23:59:59')
    if (tractorId) query = query.eq('tractor_id', tractorId)
    if (driverId)  query = query.eq('driver_id', driverId)

    const { data, error, count } = await query
    if (error) { setError(error.message); setLoading(false); return }

    let results = data || []

    // Filtre outil côté client si nécessaire (pas supporté nativement en imbriqué)
    if (toolId) {
      results = results.filter(r =>
        r.work_record_tools?.some(wrt => wrt.tool_id === toolId)
      )
    }

    setRecords(results)
    setTotal(count || 0)
    setLoading(false)
  }

  useEffect(() => { fetch() }, [page, dateFrom, dateTo, tractorId, driverId, toolId])

  async function createRecord(values, toolIds) {
    const { data: record, error } = await supabase
      .from('work_records')
      .insert(values)
      .select()
      .single()
    if (error) throw error

    if (toolIds && toolIds.length > 0) {
      const links = toolIds.map(tid => ({ work_record_id: record.id, tool_id: tid }))
      const { error: toolError } = await supabase.from('work_record_tools').insert(links)
      if (toolError) throw toolError
    }
    await fetch()
    return record
  }

  async function updateRecord(id, values, toolIds, pauses) {
    const { error } = await supabase.from('work_records').update(values).eq('id', id)
    if (error) throw error

    if (toolIds !== undefined) {
      await supabase.from('work_record_tools').delete().eq('work_record_id', id)
      if (toolIds.length > 0) {
        const links = toolIds.map(tid => ({ work_record_id: id, tool_id: tid }))
        const { error: toolError } = await supabase.from('work_record_tools').insert(links)
        if (toolError) throw toolError
      }
    }

    if (pauses !== undefined) {
      await supabase.from('work_record_pauses').delete().eq('work_record_id', id)
      const rows = pauses.filter(p => p.paused_at).map(p => ({
        work_record_id: id,
        paused_at: p.paused_at,
        resumed_at: p.resumed_at || null,
      }))
      if (rows.length > 0) {
        const { error: pauseError } = await supabase.from('work_record_pauses').insert(rows)
        if (pauseError) throw pauseError
      }
    }

    await fetch()
  }

  async function deleteRecord(id) {
    const { error } = await supabase.from('work_records').delete().eq('id', id)
    if (error) throw error
    await fetch()
  }

  async function fetchOne(id) {
    const [{ data, error }, { data: pauses }] = await Promise.all([
      supabase
        .from('work_records')
        .select(`
          *,
          tractor:tractors(id, name, gps_device_id),
          driver:profiles!work_records_driver_id_fkey(id, full_name, username),
          created_by_profile:profiles!work_records_created_by_fkey(id, full_name, username),
          work_record_tools(tool_id, tool:tools(id, name))
        `)
        .eq('id', id)
        .single(),
      supabase
        .from('work_record_pauses')
        .select('*')
        .eq('work_record_id', id)
        .order('paused_at'),
    ])
    if (error) throw error
    return { ...data, pauses: pauses || [] }
  }

  async function pauseRecord(workRecordId) {
    const { error } = await supabase.from('work_record_pauses').insert({
      work_record_id: workRecordId,
      paused_at: new Date().toISOString(),
    })
    if (error) throw error
  }

  async function resumeRecord(workRecordId) {
    const { data, error: fetchError } = await supabase
      .from('work_record_pauses')
      .select('id')
      .eq('work_record_id', workRecordId)
      .is('resumed_at', null)
      .order('paused_at', { ascending: false })
      .limit(1)
    if (fetchError) throw fetchError
    if (!data?.length) throw new Error('Aucune pause active trouvée')

    const { error } = await supabase
      .from('work_record_pauses')
      .update({ resumed_at: new Date().toISOString() })
      .eq('id', data[0].id)
    if (error) throw error
  }

  return {
    records, loading, error, total, pageSize: PAGE_SIZE,
    refetch: fetch,
    createRecord, updateRecord, deleteRecord, fetchOne,
    pauseRecord, resumeRecord,
  }
}
