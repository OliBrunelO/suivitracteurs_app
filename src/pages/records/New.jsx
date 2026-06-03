import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout'
import { WorkRecordForm } from '../../components/forms/WorkRecordForm'
import { useWorkRecords } from '../../hooks/useWorkRecords'
import toast from 'react-hot-toast'

export default function NewRecord() {
  const [saving, setSaving] = useState(false)
  const { createRecord } = useWorkRecords()
  const navigate = useNavigate()

  async function handleSubmit(values, toolIds) {
    setSaving(true)
    try {
      const record = await createRecord(values, toolIds)
      toast.success('Travail enregistré avec succès')
      navigate(`/records/${record.id}`)
    } catch (err) {
      toast.error(`Erreur : ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Nouveau travail</h1>
          <p className="text-sm text-gray-500 mt-0.5">Saisir un nouveau travail tracteur</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <WorkRecordForm
            onSubmit={handleSubmit}
            onCancel={() => navigate('/records')}
            loading={saving}
          />
        </div>
      </div>
    </AppLayout>
  )
}
