import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ArrowLeft, CheckCircle, XCircle, ThumbsUp, Trash2 } from 'lucide-react'

const STATUS_STYLE = {
  pending:      { bg: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Pending'          },
  pos_approved: { bg: 'bg-blue-100 text-blue-700 border-blue-200',       label: 'POS Approved'     },
  confirmed:    { bg: 'bg-green-100 text-green-700 border-green-200',     label: 'Payment Confirmed' },
  closed:       { bg: 'bg-gray-100 text-gray-600 border-gray-200',        label: 'Closed'           },
}

const PROMO_LABEL = {
  kid_free:    '🎁 Kids Offer — 2 Adults = 1 Kid Free',
  discount_15: '💰 15% Discount',
}

export default function BookingDetail() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { role, currentUser, userProfile } = useAuth()

  const [booking,   setBooking]  = useState(null)
  const [loading,   setLoading]  = useState(true)
  const [updating,  setUpdating] = useState(false)
  const [deleting,  setDeleting] = useState(false)

  useEffect(() => {
    getDoc(doc(db, 'bookings', id)).then(snap => {
      if (snap.exists()) setBooking({ id: snap.id, ...snap.data() })
      setLoading(false)
    })
  }, [id])

  async function updateStatus(newStatus) {
    setUpdating(true)
    try {
      await updateDoc(doc(db, 'bookings', id), {
        payment_status:            newStatus,
        updated_at:                serverTimestamp(),
        [`${newStatus}_by`]:       currentUser?.uid ?? 'unknown',
        [`${newStatus}_by_name`]:  userProfile?.name ?? 'Unknown',
        [`${newStatus}_at`]:       serverTimestamp(),
      })
      setBooking(b => ({ ...b, payment_status: newStatus }))
      const msg = {
        pos_approved: '✓ Cash payment approved — sent to accountant',
        confirmed:    '✓ Payment confirmed',
        closed:       '✓ Booking closed',
      }[newStatus] ?? 'Updated'
      toast.success(msg)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setUpdating(false)
    }
  }

  async function deleteBooking() {
    if (!window.confirm('Permanently delete this booking? This cannot be undone.')) return
    setDeleting(true)
    try {
      await deleteDoc(doc(db, 'bookings', id))
      toast.success('Booking deleted')
      navigate('/bookings')
    } catch (e) {
      toast.error(e.message)
      setDeleting(false)
    }
  }

  if (loading) return <p className="text-center text-gray-400 py-20">Loading…</p>
  if (!booking) return <p className="text-center text-gray-400 py-20">Booking not found.</p>

  const statusInfo  = STATUS_STYLE[booking.payment_status] ?? STATUS_STYLE.pending
  const isCash      = booking.payment_method === 'cash'
  const status      = booking.payment_status
  const canDelete   = userProfile?.username === 'sowmyawc'

  // ── What action buttons each role sees ─────────────────────────────────────
  // POS manager: can only approve cash payments that are still 'pending'
  const showPosApprove = role === 'pos_manager' && isCash && status === 'pending'

  // Accountant: confirms UPI (pending→confirmed) or cash after POS approved (pos_approved→confirmed)
  const showConfirm =
    role === 'accountant' &&
    (
      (!isCash && status === 'pending') ||
      (isCash  && status === 'pos_approved')
    )

  // Accountant: closes after confirming
  const showClose = role === 'accountant' && status === 'confirmed'

  return (
    <div className="space-y-4 max-w-lg mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="page-title truncate">{booking.firstname} {booking.lastname}</h1>
          <p className="text-xs text-gray-500 font-mono">{booking.booking_id}</p>
        </div>
        <span className={`text-xs px-3 py-1.5 rounded-full font-semibold border flex-shrink-0 ${statusInfo.bg}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Booking details */}
      <div className="card p-4 space-y-2.5">
        <h2 className="section-title mb-1">Booking Details</h2>
        {[
          ['Booking ID',    booking.booking_id],
          ['Phone',         booking.phone],
          ['Email',         booking.email ?? '—'],
          ['Festival Date', booking.festival_date ?? 'To be confirmed'],
          ['Adults',        booking.adults],
          ['Kids (4–10)',   booking.kids ?? 0],
          ['Booked via',    booking.booking_source === 'public' ? '📱 Public Form' : '🏪 POS Staff'],
          ['Submitted on',  booking.created_at?.toDate
            ? format(booking.created_at.toDate(), 'dd MMM yyyy, hh:mm a')
            : '—'],
        ].map(([k, v]) => (
          <div key={k} className="flex items-start justify-between text-sm gap-4">
            <span className="text-gray-500 flex-shrink-0">{k}</span>
            <span className="font-medium text-gray-800 dark:text-white text-right">{v}</span>
          </div>
        ))}

        {/* Promo offer */}
        {booking.promo_type && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between text-sm gap-4">
              <span className="text-gray-500 flex-shrink-0">Promo Used</span>
              <span className="font-semibold text-mango-600 text-right">
                {PROMO_LABEL[booking.promo_type] ?? booking.promo_type}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Payment details */}
      <div className="card p-4 space-y-2.5">
        <h2 className="section-title mb-1">Payment Details</h2>

        <div className="flex items-start justify-between text-sm gap-4">
          <span className="text-gray-500">Method</span>
          <span className="font-semibold text-gray-800 dark:text-white">
            {isCash ? '💵 Cash' : '📱 UPI / Online'}
          </span>
        </div>

        <div className="flex items-start justify-between text-sm gap-4">
          <span className="text-gray-500">Amount Paid</span>
          <span className="font-bold text-green-600 text-base">
            {booking.payment_amount ? `₹${booking.payment_amount}` : '—'}
          </span>
        </div>

        {/* Receipt image (UPI only) */}
        {booking.receipt_image && (
          <div className="pt-2">
            <p className="text-xs text-gray-400 mb-2">Payment Receipt</p>
            <img
              src={booking.receipt_image}
              alt="Payment receipt"
              className="w-full max-h-72 object-contain rounded-xl border border-gray-200 bg-gray-50"
            />
          </div>
        )}

        {/* Verification hint for accountant */}
        {role === 'accountant' && !isCash && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-xs text-blue-600 font-medium">
              💡 Verify the receipt screenshot in your UPI app or bank statement before confirming.
            </p>
          </div>
        )}

        {/* Cash pending POS approval note */}
        {isCash && status === 'pending' && role === 'accountant' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs text-amber-700 font-medium">
              ⏳ Waiting for POS manager to approve this cash payment before you can confirm.
            </p>
          </div>
        )}
      </div>

      {/* ── Action Buttons ─────────────────────────────────────────────────── */}

      {/* POS: approve cash */}
      {showPosApprove && (
        <button
          onClick={() => updateStatus('pos_approved')}
          disabled={updating}
          className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <ThumbsUp size={20} />
          {updating ? 'Approving…' : 'Approve Cash Payment'}
        </button>
      )}

      {/* Accountant: confirm payment */}
      {showConfirm && (
        <button
          onClick={() => updateStatus('confirmed')}
          disabled={updating}
          className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2"
        >
          <CheckCircle size={20} />
          {updating ? 'Confirming…' : 'Confirm Payment'}
        </button>
      )}

      {/* Accountant: close booking */}
      {showClose && (
        <button
          onClick={() => updateStatus('closed')}
          disabled={updating}
          className="w-full py-4 text-base flex items-center justify-center gap-2
                     bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors"
        >
          <XCircle size={20} />
          {updating ? 'Closing…' : 'Close Booking'}
        </button>
      )}

      {/* Closed state */}
      {status === 'closed' && (
        <div className="card p-4 text-center bg-gray-50 dark:bg-gray-700">
          <p className="text-sm font-semibold text-gray-500">✓ This booking is closed</p>
        </div>
      )}

      {/* POS: waiting message after approval */}
      {role === 'pos_manager' && isCash && status === 'pos_approved' && (
        <div className="card p-4 text-center bg-blue-50 border border-blue-200">
          <p className="text-sm font-semibold text-blue-600">✓ Approved — pending accountant confirmation</p>
        </div>
      )}

      {/* POS: UPI bookings — no action */}
      {role === 'pos_manager' && !isCash && (
        <div className="card p-4 text-center bg-gray-50 dark:bg-gray-700">
          <p className="text-sm text-gray-500">UPI payment verification is handled by the accountant.</p>
        </div>
      )}

      {/* Super admin delete — sowmyawc only */}
      {canDelete && (
        <button
          onClick={deleteBooking}
          disabled={deleting}
          className="w-full py-4 text-base flex items-center justify-center gap-2
                     bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
        >
          <Trash2 size={20} />
          {deleting ? 'Deleting…' : 'Delete Booking'}
        </button>
      )}

    </div>
  )
}
