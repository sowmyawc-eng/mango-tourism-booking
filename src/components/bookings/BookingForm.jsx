import { useEffect, useState } from 'react'
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { generateBookingId } from '../../utils/generateId'
import { IndianRupee } from 'lucide-react'

export default function BookingForm() {
  const navigate  = useNavigate()
  const [posLocs, setPosLocs] = useState([])
  const [saving, setSaving]   = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  useEffect(() => {
    getDocs(collection(db, 'pos_locations')).then(snap =>
      setPosLocs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [])

  const R = { required: 'This field is required' }

  async function onSubmit(data) {
    setSaving(true)
    try {
      const bookingId = generateBookingId()

      await addDoc(collection(db, 'bookings'), {
        booking_id:      bookingId,
        firstname:       data.firstname,
        lastname:        data.lastname,
        phone:           data.phone,
        email:           data.email,
        festival_date:   data.festival_date,
        adults:          Number(data.adults),
        kids:            Number(data.kids ?? 0),
        transaction_id:  data.transaction_id,
        payment_amount:  data.payment_amount,
        payment_status:  'pending',
        ticket_status:   'not_generated',
        remarks:         data.remarks || null,
        booking_source:  'pos',
        pos_location:    data.pos_location || null,
        created_at:      serverTimestamp(),
      })

      toast.success(`Booking ${bookingId} submitted!`)
      navigate('/bookings')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <h1 className="page-title">New Booking</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Customer Details */}
        <div className="card p-4 space-y-3">
          <h2 className="section-title">Customer Details</h2>

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
                pattern: { value: /^[0-9]{10}$/, message: 'Enter a valid 10-digit number' }
              })} />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="label">Email ID <span className="text-red-500">*</span></label>
            <input className="input-field" type="email" placeholder="ravi@example.com"
              {...register('email', {
                required: 'Required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' }
              })} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
        </div>

        {/* Booking Details */}
        <div className="card p-4 space-y-3">
          <h2 className="section-title">Booking Details</h2>

          <div>
            <label className="label">Festival Date <span className="text-red-500">*</span></label>
            <input className="input-field" type="date" {...register('festival_date', R)} />
            {errors.festival_date && <p className="text-red-500 text-xs mt-1">{errors.festival_date.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Adults <span className="text-red-500">*</span></label>
              <input className="input-field" type="number" min="1" placeholder="1"
                {...register('adults', { required: 'Required', min: { value: 1, message: 'Min 1 adult' } })} />
              {errors.adults && <p className="text-red-500 text-xs mt-1">{errors.adults.message}</p>}
            </div>
            <div>
              <label className="label">Kids (Age 4–10) <span className="text-red-500">*</span></label>
              <input className="input-field" type="number" min="0" placeholder="0"
                {...register('kids', R)} />
              {errors.kids && <p className="text-red-500 text-xs mt-1">{errors.kids.message}</p>}
            </div>
          </div>

          {posLocs.length > 0 && (
            <div>
              <label className="label">POS Location <span className="text-red-500">*</span></label>
              <select className="input-field" {...register('pos_location', R)}>
                <option value="">Select location…</option>
                {posLocs.map(p => <option key={p.id} value={p.id}>{p.pos_name}</option>)}
              </select>
              {errors.pos_location && <p className="text-red-500 text-xs mt-1">{errors.pos_location.message}</p>}
            </div>
          )}

          <div>
            <label className="label">Remarks <span className="text-red-500">*</span></label>
            <textarea className="input-field" rows={2}
              placeholder="Any additional notes about this booking"
              {...register('remarks', R)} />
            {errors.remarks && <p className="text-red-500 text-xs mt-1">{errors.remarks.message}</p>}
          </div>
        </div>

        {/* Payment Details */}
        <div className="card p-4 space-y-3">
          <h2 className="section-title">Payment Details</h2>
          <p className="text-xs text-gray-500 -mt-1">
            Ask the customer to share their UPI transaction ID after payment.
          </p>

          <div>
            <label className="label">Amount Paid (₹) <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₹</span>
              <input className="input-field pl-7" type="number" placeholder="500"
                {...register('payment_amount', R)} />
            </div>
            {errors.payment_amount && <p className="text-red-500 text-xs mt-1">{errors.payment_amount.message}</p>}
          </div>

          <div>
            <label className="label">UPI Transaction ID / UTR Number <span className="text-red-500">*</span></label>
            <input className="input-field font-mono" placeholder="e.g. 412345678901"
              {...register('transaction_id', R)} />
            {errors.transaction_id && <p className="text-red-500 text-xs mt-1">{errors.transaction_id.message}</p>}
            <p className="text-xs text-gray-400 mt-1">
              Found in customer's UPI app → Payment history → Transaction details
            </p>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full text-base py-4">
          {saving ? 'Submitting…' : '✓ Submit Booking'}
        </button>
      </form>
    </div>
  )
}
