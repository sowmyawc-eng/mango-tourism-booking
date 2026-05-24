import { useState, useEffect } from 'react'
import { collection, addDoc, updateDoc, doc, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'

export default function LeadForm({ onClose, onSaved, existing }) {
  const [saving,     setSaving]     = useState(false)
  const [locations,  setLocations]  = useState([])
  const { role, userProfile } = useAuth()

  const isPOS = role === 'pos_manager'

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      ...(existing ?? {}),
      // For new leads by POS manager, lock location to their assigned pos
      pos_location: existing?.pos_location
        ?? (isPOS ? (userProfile?.assigned_pos ?? '') : ''),
    }
  })

  useEffect(() => {
    getDocs(collection(db, 'pos_locations')).then(snap => {
      setLocations(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [])

  const R = { required: 'This field is required' }

  async function onSubmit(data) {
    setSaving(true)
    try {
      if (existing) {
        await updateDoc(doc(db, 'leads', existing.id), {
          firstname:     data.firstname,
          lastname:      data.lastname,
          phone:         data.phone,
          email:         data.email,
          festival_date: data.festival_date,
          notes:         data.notes,
          status:        data.status || 'new_lead',
          pos_location:  isPOS ? (userProfile?.assigned_pos ?? existing.pos_location ?? '') : (data.pos_location ?? ''),
          updated_at:    serverTimestamp(),
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
          pos_location:  isPOS ? (userProfile?.assigned_pos ?? data.pos_location ?? '') : (data.pos_location ?? ''),
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
              <label className="label">Last Name</label>
              <input className="input-field" placeholder="Kumar" {...register('lastname')} />
            </div>
          </div>

          <div>
            <label className="label">Phone Number <span className="text-red-500">*</span></label>
            <input className="input-field" type="tel" placeholder="9876543210"
              {...register('phone', {
                required: 'Required',
                pattern: { value: /^[6-9][0-9]{9}$/, message: 'Enter valid 10-digit mobile number' }
              })} />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="label">Email ID</label>
            <input className="input-field" type="email" placeholder="ravi@example.com"
              {...register('email', {
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter valid email' }
              })} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label">Interested Festival Date</label>
            <input className="input-field" type="date" {...register('festival_date')} />
          </div>

          <div>
            <label className="label">POS Location <span className="text-red-500">*</span></label>
            {isPOS ? (
              <input
                className="input-field bg-gray-50 text-gray-500 cursor-not-allowed"
                readOnly
                value={userProfile?.assigned_pos ?? ''}
              />
            ) : (
              <select className="input-field" {...register('pos_location', { required: 'Select a location' })}>
                <option value="">— Select location —</option>
                {locations.map(l => (
                  <option key={l.id} value={l.pos_name}>{l.pos_name}</option>
                ))}
              </select>
            )}
            {errors.pos_location && <p className="text-red-500 text-xs mt-1">{errors.pos_location.message}</p>}
          </div>

          <div>
            <label className="label">Status</label>
            <select className="input-field" {...register('status')}>
              <option value="new_lead">New Lead</option>
              <option value="interested">Interested</option>
              <option value="follow_up">Follow-up Required</option>
            </select>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="input-field" rows={3}
              placeholder="Where did they enquire? What did they ask?"
              {...register('notes')} />
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
