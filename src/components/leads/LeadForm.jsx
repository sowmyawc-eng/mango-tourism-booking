import { useState } from 'react'
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'

export default function LeadForm({ onClose, onSaved, existing }) {
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: existing ?? {}
  })

  const R = { required: 'This field is required' }

  async function onSubmit(data) {
    setSaving(true)
    try {
      if (existing) {
        await updateDoc(doc(db, 'leads', existing.id), {
          ...data,
          updated_at: serverTimestamp(),
        })
        toast.success('Lead updated')
      } else {
        await addDoc(collection(db, 'leads'), {
          firstname:     data.firstname,
          lastname:      data.lastname,
          phone:         data.phone,
          email:         data.email,
          festival_date: data.festival_date,
          notes:         data.notes,
          status:        data.status || 'new_lead',
          created_at:    serverTimestamp(),
        })
        toast.success('Lead saved!')
      }
      onSaved?.()
      onClose?.()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4">
      <div className="card w-full max-w-md p-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">{existing ? 'Edit Lead' : 'Add Lead'}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">First Name <span className="text-red-500">*</span></label>
              <input className="input-field" placeholder="Ravi" {...register('firstname', R)} />
              {errors.firstname && <p className="text-red-500 text-xs mt-1">{errors.firstname.message}</p>}
            </div>
            <div>
              <label className="label">Last Name <span className="text-red-500">*</span></label>
              <input className="input-field" placeholder="Kumar" {...register('lastname', R)} />
              {errors.lastname && <p className="text-red-500 text-xs mt-1">{errors.lastname.message}</p>}
            </div>
          </div>

          <div>
            <label className="label">Phone Number <span className="text-red-500">*</span></label>
            <input className="input-field" type="tel" placeholder="9876543210"
              {...register('phone', {
                required: 'Required',
                pattern: { value: /^[0-9]{10}$/, message: 'Enter valid 10-digit number' }
              })} />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="label">Email ID <span className="text-red-500">*</span></label>
            <input className="input-field" type="email" placeholder="ravi@example.com"
              {...register('email', {
                required: 'Required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter valid email' }
              })} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label">Interested Festival Date <span className="text-red-500">*</span></label>
            <input className="input-field" type="date" {...register('festival_date', R)} />
            {errors.festival_date && <p className="text-red-500 text-xs mt-1">{errors.festival_date.message}</p>}
          </div>

          <div>
            <label className="label">Status <span className="text-red-500">*</span></label>
            <select className="input-field" {...register('status', R)}>
              <option value="new_lead">New Lead</option>
              <option value="interested">Interested</option>
              <option value="follow_up">Follow-up Required</option>
            </select>
          </div>

          <div>
            <label className="label">Notes <span className="text-red-500">*</span></label>
            <textarea className="input-field" rows={3}
              placeholder="Where did they enquire? What did they ask?"
              {...register('notes', R)} />
            {errors.notes && <p className="text-red-500 text-xs mt-1">{errors.notes.message}</p>}
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : existing ? 'Update Lead' : 'Save Lead'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
