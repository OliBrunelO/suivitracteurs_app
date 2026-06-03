import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetch() {
    setLoading(true)
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  async function createCategory(values) {
    const { error } = await supabase.from('categories').insert(values)
    if (error) throw error
    await fetch()
  }

  async function updateCategory(id, values) {
    const { error } = await supabase.from('categories').update(values).eq('id', id)
    if (error) throw error
    await fetch()
  }

  async function deleteCategory(id) {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
    await fetch()
  }

  return { categories, loading, refetch: fetch, createCategory, updateCategory, deleteCategory }
}
