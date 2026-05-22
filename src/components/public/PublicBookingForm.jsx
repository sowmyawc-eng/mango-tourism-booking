import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { collection, addDoc, getDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { useForm } from 'react-hook-form'
import { generateBookingId } from '../../utils/generateId'
import { Leaf, PartyPopper } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PublicBookingForm() {
  const [searchParams] = useSearchParams()
  const posId = searchParams.get('pos')

  const [posName, setPosName]       = useState(null)
  const [saving, setSaving]         = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [bookingRef, setBookingRef] = useState('')

  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const noDate = watch('no_date')

  const R = { required: 'This field is required' }

  useEffect(() => {
    if (posId) {
      getDoc(doc(db, 'pos_locations', posId)).then(snap => {
        if (snap.exists()) setPosName(snap.data().pos_name)
      })
    }
  }, [posId])

  async function onSubmit(data) {
    if (!noDate && !data.festival_date) {
      toast.error('Please select a festival date or tick "not sure"')
      return
    }
    setSaving(true)
    try {
      const bookingId = generateBookingId()

      await addDoc(collection(db, 'bookings'), {
        booking_id:      bookingId,
        firstname:       data.firstname,
        lastname:        data.lastname,
        phone:           data.phone,
        email:           data.email,
        festival_date:   noDate ? null : data.festival_date,
        adults:          Number(data.adults),
        kids:            Number(data.kids ?? 0),
        transaction_id:  data.transaction_id,
        payment_amount:  data.payment_amount,
        payment_status:  'pending',
        ticket_status:   'not_generated',
        booking_source:  'public',
        pos_location:    posId || null,
        created_at:      serverTimestamp(),
      })

      setBookingRef(bookingId)
      setSubmitted(true)
    } catch (e) {
      toast.error('Something went wrong. Please try again.')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  /* ── Success screen ─────────────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mango-50 to-orange-100 flex items-center justify-center px-4">
        <div className="card p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PartyPopper size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Submitted!</h2>
          <p className="text-gray-600 text-sm mb-5">
            Thank you! Our team will verify your payment and send your tickets shortly.
          </p>
          <div className="bg-mango-50 border border-mango-200 rounded-xl p-4 mb-4">
            <p className="text-xs text-gray-500 mb-1">Your Booking Reference</p>
            <p className="text-xl font-bold font-mono text-mango-700">{bookingRef}</p>
          </div>
          <p className="text-xs text-gray-400">Please save this reference number for follow-up.</p>
        </div>
      </div>
    )
  }

  /* ── Form ───────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-mango-50 to-orange-100 pb-10">

      {/* Header */}
      <div className="bg-mango-500 text-white px-4 pt-12 pb-8 text-center">
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Leaf size={24} />
        </div>
        <h1 className="text-xl font-bold">Hanu Reddy Mango Tourism</h1>
        <p className="text-mango-100 text-sm mt-1">Festival Experience Booking</p>
        {posName && (
          <span className="text-xs mt-2 bg-white/20 inline-block px-3 py-1 rounded-full">
            📍 {posName}
          </span>
        )}
      </div>

      <div className="px-4 -mt-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Personal details */}
          <div className="card p-4 space-y-3">
            <h2 className="section-title">Your Details</h2>

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
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' }
                })} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
          </div>

          {/* Visit details */}
          <div className="card p-4 space-y-3">
            <h2 className="section-title">Visit Details</h2>

            <label className="flex items-center gap-3 p-3 bg-mango-50 dark:bg-mango-900/20 rounded-xl cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-mango-500" {...register('no_date')} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                I am not yet sure about the festival date
              </span>
            </label>

            {!noDate && (
              <div>
                <label className="label">Festival Date <span className="text-red-500">*</span></label>
                <input className="input-field" type="date" {...register('festival_date')} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Adults <span className="text-red-500">*</span></label>
                <input className="input-field" type="number" min="1" defaultValue={1}
                  {...register('adults', { required: 'Required', min: { value: 1, message: 'Min 1' } })} />
                {errors.adults && <p className="text-red-500 text-xs mt-1">{errors.adults.message}</p>}
              </div>
              <div>
                <label className="label">Kids (Age 4–10) <span className="text-red-500">*</span></label>
                <input className="input-field" type="number" min="0" defaultValue={0}
                  {...register('kids', R)} />
                {errors.kids && <p className="text-red-500 text-xs mt-1">{errors.kids.message}</p>}
              </div>
            </div>
          </div>

          {/* Payment details */}
          <div className="card p-4 space-y-3">
            <h2 className="section-title">Payment Details</h2>
            <p className="text-xs text-gray-500 -mt-1">
              Pay via UPI and enter your transaction details below.
            </p>

            <div>
              <label className="label">Amount Paid (₹) <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">₹</span>
                <input className="input-field pl-7" type="number" placeholder="500"
                  {...register('payment_amount', R)} />
              </div>
              {errors.payment_amount && <p className="text-red-500 text-xs mt-1">{errors.payment_amount.message}</p>}
            </div>

            <div>
              <label className="label">UPI Transaction ID / UTR Number <span className="text-red-500">*</span></label>
              <input className="input-field font-mono tracking-wide"
                placeholder="e.g. 412345678901"
                {...register('transaction_id', R)} />
              {errors.transaction_id && <p className="text-red-500 text-xs mt-1">{errors.transaction_id.message}</p>}
              <p className="text-xs text-gray-400 mt-1">
                Open your UPI app → Passbook / History → tap the payment → copy the Transaction ID
              </p>
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full py-4 text-base">
            {saving ? 'Submitting…' : '🎉 Submit Booking Enquiry'}
          </button>

          <p className="text-center text-xs text-gray-400 pb-4">
            Our team will verify your payment and confirm your booking shortly.
          </p>
        </form>
      </div>
    </div>
  )
}
