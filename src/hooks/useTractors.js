import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useTractors({ activeOnly = false } = {}) {
  const [tractors, setTractors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetch() {
    setLoading(true)
    let query = supabase.from('tractors').select('*').order('name')
    if (activeOnly) query = query.eq('active', true)
    const { data, error } = await query
    if (error) setError(error.message)
    else setTractors(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [activeOnly])

  async function createTractor(values) {
    const { error } = await supabase.from('tractors').insert(values)
    if (error) throw error
    await fetch()
  }

  async function updateTractor(id, values) {
    const { error } = await supabase.from('tractors').update(values).eq('id', id)
    if (error) throw error
    await fetch()
  }

  async function deleteTractor(id) {
    const { error } = await supabase.from('tractors').delete().eq('id', id)
    if (error) throw error
    await fetch()
  }

  return { tractors, loading, error, refetch: fetch, createTractor, updateTractor, deleteTractor }
}
