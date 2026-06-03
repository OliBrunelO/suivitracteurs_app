import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useTools({ activeOnly = false } = {}) {
  const [tools, setTools] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetch() {
    setLoading(true)
    let query = supabase
      .from('tools')
      .select('*, category:categories(id, name)')
      .order('name')
    if (activeOnly) query = query.eq('active', true)
    let { data, error } = await query

    // Si la table categories n'existe pas encore (migration non exécutée),
    // on retombe sur une requête sans jointure
    if (error) {
      let fallbackQ = supabase.from('tools').select('*').order('name')
      if (activeOnly) fallbackQ = fallbackQ.eq('active', true)
      const fallback = await fallbackQ
      if (!fallback.error) {
        data = fallback.data
        error = null
      }
    }

    if (error) setError(error.message)
    else setTools(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [activeOnly])

  async function createTool(values) {
    const { error } = await supabase.from('tools').insert(values)
    if (error) throw error
    await fetch()
  }

  async function updateTool(id, values) {
    const { error } = await supabase.from('tools').update(values).eq('id', id)
    if (error) throw error
    await fetch()
  }

  async function deleteTool(id) {
    const { error } = await supabase.from('tools').delete().eq('id', id)
    if (error) throw error
    await fetch()
  }

  return { tools, loading, error, refetch: fetch, createTool, updateTool, deleteTool }
}
