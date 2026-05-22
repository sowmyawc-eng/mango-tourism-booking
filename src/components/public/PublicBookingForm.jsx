import { useEffect, useRef, useState } from 'react'
import {
  collection, addDoc, getDocs,
  query, where, serverTimestamp
} from 'firebase/firestore'
import { db } from '../../firebase'
import { useForm } from 'react-hook-form'
import { generateBookingId } from '../../utils/generateId'
import { Leaf, PartyPopper, Upload, X, Image, Tag } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Fixed festival dates ─────────────────────────────────────────────────────
const FESTIVAL_DATES = [
  { value: '2026-06-07', label: 'Sunday, 7 June 2026'  },
  { value: '2026-06-14', label: 'Sunday, 14 June 2026' },
  { value: '2026-06-21', label: 'Sunday, 21 June 2026' },
  { value: '2026-06-28', label: 'Sunday, 28 June 2026' },
]

// ── Compress image to base64 ─────────────────────────────────────────────────
async function compressImage(file, maxWidth = 900, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new window.Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width  = maxWidth
        }
        const canvas = document.createElement('canvas')
        canvas.width  = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}


export default function PublicBookingForm() {
  const [locations,     setLocations]     = useState([])
  const [saving,        setSaving]        = useState(false)
  const [submitted,     setSubmitted]     = useState(false)
  const [bookingRef,    setBookingRef]    = useState('')

  // Payment method
  const [payMethod, setPayMethod] = useState('upi')   // 'upi' | 'cash'

  // Receipt upload
  const [receiptBase64, setReceiptBase64] = useState(null)
  const [receiptName,   setReceiptName]   = useState('')
  const fileInputRef = useRef()

  // Promo selection — loaded from Firestore
  const [promoCodes,   setPromoCodes]   = useState([])
  const [selectedPromo, setSelectedPromo] = useState('')  // promo doc id

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const PROMO_TYPE_LABEL = {
    kid_free:    '🎁 Kids Offer — 2 Adults = 1 Kid Free',
    discount_15: '💰 15% Discount on total amount',
  }

  // Load active locations + active promo codes
  useEffect(() => {
    getDocs(query(collection(db, 'pos_locations'), where('active_status', '==', true)))
      .then(snap => setLocations(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {})

    getDocs(query(collection(db, 'promo_codes'), where('active', '==', true)))
      .then(snap => setPromoCodes(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {})
  }, [])

  // ── Receipt upload ─────────────────────────────────────────────────────────
  async function handleReceiptChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return }
    if (file.size > 8 * 1024 * 1024)    { toast.error('File too large — max 8 MB');   return }
    try {
      const b64 = await compressImage(file)
      if (b64.length > 900_000) { toast.error('Image still too large. Try a smaller file.'); return }
      setReceiptBase64(b64)
      setReceiptName(file.name)
    } catch { toast.error('Could not process image. Try another file.') }
  }

  function clearReceipt() {
    setReceiptBase64(null)
    setReceiptName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function onSubmit(data) {
    if (payMethod === 'upi' && !receiptBase64) {
      toast.error('Please upload your UPI payment receipt')
      return
    }
    setSaving(true)
    try {
      const bookingId = generateBookingId()
      const phone     = '+91' + data.phone.replace(/\D/g, '')

      await addDoc(collection(db, 'bookings'), {
        booking_id:     bookingId,
        firstname:      data.firstname.trim(),
        lastname:       data.lastname.trim(),
        phone,
        email:          data.email.trim().toLowerCase(),
        festival_date:  data.festival_date,
        adults:         Number(data.adults),
        kids:           Number(data.kids ?? 0),
        payment_method: payMethod,
        payment_amount: Number(data.payment_amount),
        receipt_image:  payMethod === 'upi' ? receiptBase64 : null,
        promo_code:     selectedPromo ? promoCodes.find(p => p.id === selectedPromo)?.code  ?? null : null,
        promo_type:     selectedPromo ? promoCodes.find(p => p.id === selectedPromo)?.type  ?? null : null,
        payment_status: 'pending',
        ticket_status:  'not_generated',
        booking_source: 'public',
        pos_location:   data.pos_location || null,
        created_at:     serverTimestamp(),
      })

      setBookingRef(bookingId)
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      console.error(e)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  /* ── Success screen ─────────────────────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mango-50 to-orange-100 flex items-center justify-center px-4">
        <div className="card p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PartyPopper size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Submitted!</h2>
          <p className="text-gray-600 text-sm mb-5">
            Thank you! Our team will verify your payment and confirm your booking.
          </p>
          <div className="bg-mango-50 border border-mango-200 rounded-xl p-4 mb-4">
            <p className="text-xs text-gray-500 mb-1">Your Booking Reference</p>
            <p className="text-2xl font-bold font-mono text-mango-700">{bookingRef}</p>
          </div>
          <p className="text-xs text-gray-400">Save this reference number for any follow-up queries.</p>
        </div>
      </div>
    )
  }

  /* ── Form ───────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-mango-50 to-orange-100 pb-12">

      {/* Banner */}
      <div className="w-full bg-[#c8e8e4]">
        <img
          src="/banner.avif"
          alt="Hanu Reddy Mango Tourism – June 2026"
          className="w-full block"
          style={{ maxHeight: '88px', objectFit: 'contain' }}
        />
      </div>
      <div className="bg-mango-500 text-white px-4 py-2 text-center">
        <p className="text-white text-sm font-semibold tracking-wide">Festival Experience Booking Form</p>
        <p className="text-mango-100 text-xs mt-0.5">Smart Booking &amp; POS Management</p>
      </div>

      <div className="px-4 -mt-4 max-w-lg mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* ── Personal Details ─────────────────────────────────────────── */}
          <div className="card p-4 space-y-3">
            <h2 className="section-title">Your Details</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First Name <span className="text-red-500">*</span></label>
                <input className="input-field" placeholder="Venkatesh"
                  autoComplete="given-name"
                  {...register('firstname', { required: 'Required' })} />
                {errors.firstname && <p className="text-red-500 text-xs mt-1">{errors.firstname.message}</p>}
              </div>
              <div>
                <label className="label">Last Name <span className="text-red-500">*</span></label>
                <input className="input-field" placeholder="Reddy"
                  autoComplete="family-name"
                  {...register('lastname', { required: 'Required' })} />
                {errors.lastname && <p className="text-red-500 text-xs mt-1">{errors.lastname.message}</p>}
              </div>
            </div>

            {/* Indian mobile */}
            <div>
              <label className="label">Mobile Number <span className="text-red-500">*</span></label>
              <div className="flex">
                <span className="inline-flex items-center px-3 h-10 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl text-sm text-gray-600 font-medium select-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                  +91
                </span>
                <input
                  className="input-field rounded-l-none flex-1"
                  type="tel" inputMode="numeric" maxLength={10}
                  placeholder="98765 43210" autoComplete="tel-national"
                  {...register('phone', {
                    required: 'Required',
                    pattern: { value: /^[6-9][0-9]{9}$/, message: 'Enter valid 10-digit Indian mobile number' },
                  })} />
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="label">Email ID <span className="text-red-500">*</span></label>
              <input
                className="input-field" type="email" inputMode="email"
                placeholder="venkatesh@gmail.com" autoComplete="email"
                {...register('email', {
                  required: 'Required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, message: 'Enter a valid email address' },
                })} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
          </div>

          {/* ── Visit Details ─────────────────────────────────────────────── */}
          <div className="card p-4 space-y-3">
            <h2 className="section-title">Visit Details</h2>

            {/* Booking location */}
            <div>
              <label className="label">Booking Location <span className="text-red-500">*</span></label>
              <select className="input-field"
                {...register('pos_location', { required: 'Please select your booking location' })}>
                <option value="">Select location…</option>
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.pos_name}</option>
                ))}
              </select>
              {errors.pos_location && <p className="text-red-500 text-xs mt-1">{errors.pos_location.message}</p>}
            </div>

            {/* Festival date */}
            <div>
              <label className="label">Festival Date <span className="text-red-500">*</span></label>
              <select className="input-field"
                {...register('festival_date', { required: 'Please select a festival date' })}>
                <option value="">Select date…</option>
                {FESTIVAL_DATES.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
              {errors.festival_date && <p className="text-red-500 text-xs mt-1">{errors.festival_date.message}</p>}
            </div>

            {/* Adults + Kids */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Adults <span className="text-red-500">*</span></label>
                <input className="input-field" type="number" inputMode="numeric"
                  min="1" defaultValue={1}
                  {...register('adults', {
                    required: 'Required',
                    min: { value: 1, message: 'At least 1 adult' },
                  })} />
                {errors.adults && <p className="text-red-500 text-xs mt-1">{errors.adults.message}</p>}
              </div>
              <div>
                <label className="label">Kids <span className="text-xs text-gray-400">(Age 4–10, optional)</span></label>
                <input className="input-field" type="number" inputMode="numeric"
                  min="0" defaultValue={0}
                  {...register('kids', { min: { value: 0, message: 'Cannot be negative' } })} />
                {errors.kids && <p className="text-red-500 text-xs mt-1">{errors.kids.message}</p>}
              </div>
            </div>

            {/* Promo code selection — loaded from admin */}
            {promoCodes.length > 0 && (
              <div>
                <label className="label flex items-center gap-1.5">
                  <Tag size={13} className="text-mango-500" /> Promo Code
                  <span className="text-xs text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  className="input-field"
                  value={selectedPromo}
                  onChange={e => setSelectedPromo(e.target.value)}
                >
                  <option value="">No promo code</option>
                  {promoCodes.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {PROMO_TYPE_LABEL[p.type] ?? p.type}
                    </option>
                  ))}
                </select>
                {selectedPromo && (
                  <p className="text-xs text-mango-600 mt-1 font-medium">
                    ✓ {PROMO_TYPE_LABEL[promoCodes.find(p => p.id === selectedPromo)?.type] ?? ''}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Payment Details ───────────────────────────────────────────── */}
          <div className="card p-4 space-y-3">
            <h2 className="section-title">Payment Details</h2>

            {/* Payment method toggle */}
            <div>
              <label className="label">Payment Method <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 'upi',  label: '📱 UPI / Online' },
                  { val: 'cash', label: '💵 Cash'         },
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setPayMethod(opt.val)}
                    className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                      payMethod === opt.val
                        ? 'bg-mango-500 text-white border-mango-500 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-mango-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="label">Amount Paid <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">₹</span>
                <input className="input-field pl-7" type="number" inputMode="numeric" placeholder="500"
                  {...register('payment_amount', { required: 'Required', min: { value: 1, message: 'Enter amount' } })} />
              </div>
              {selectedPromo && (
                <p className="text-xs text-green-600 mt-1 font-medium">
                  🎉 Enter the final amount you paid after your promo discount
                </p>
              )}
              {errors.payment_amount && <p className="text-red-500 text-xs mt-1">{errors.payment_amount.message}</p>}
            </div>

            {/* UPI-only fields */}
            {payMethod === 'upi' && (
              <>
                {/* Receipt upload */}
                <div>
                  <label className="label">Payment Receipt Screenshot <span className="text-red-500">*</span></label>
                  {!receiptBase64 ? (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-mango-300 rounded-xl p-6 flex flex-col items-center gap-2 text-mango-500 hover:bg-mango-50 transition-colors">
                      <Upload size={28} />
                      <span className="text-sm font-medium">Tap to upload receipt</span>
                      <span className="text-xs text-gray-400">JPG, PNG • Max 8 MB</span>
                    </button>
                  ) : (
                    <div className="rounded-xl overflow-hidden border border-mango-200">
                      <img src={receiptBase64} alt="Receipt"
                        className="w-full max-h-56 object-contain bg-gray-50" />
                      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border-t border-green-100">
                        <Image size={14} className="text-green-600 flex-shrink-0" />
                        <span className="text-xs text-green-700 truncate flex-1">{receiptName}</span>
                        <button type="button" onClick={clearReceipt}
                          className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*"
                    className="hidden" onChange={handleReceiptChange} />
                </div>
              </>
            )}

            {/* Cash note */}
            {payMethod === 'cash' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-700 font-medium">
                  💵 Cash payments are collected at the stall. Please carry the exact amount.
                </p>
              </div>
            )}
          </div>

          <button type="submit" disabled={saving}
            className="btn-primary w-full py-4 text-base font-semibold">
            {saving ? 'Submitting…' : '🎉 Submit Booking'}
          </button>

          <p className="text-center text-xs text-gray-400 pb-4">
            Our team will verify your payment and confirm your booking shortly.
          </p>
        </form>
      </div>
    </div>
  )
}
