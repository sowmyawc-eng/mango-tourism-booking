import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'

const STATUS_STYLE = {
  pending:   { bg: 'bg-yellow-100 text-yellow-700 border-yellow-200',  label: 'Pending Verification' },
  confirmed: { bg: 'bg-green-100 text-green-700 border-green-200',     label: 'Payment Confirmed'    },
  closed:    { bg: 'bg-gray-100 text-gray-600 border-gray-200',        label: 'Closed'               },
}

export default function BookingDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [booking, setBooking]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [updating, setUpdating] = useState(false)

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
        payment_status: newStatus,
        updated_at: serverTimestamp(),
      })
      setBooking(b => ({ ...b, payment_status: newStatus }))
      toast.success(newStatus === 'confirmed' ? 'Payment confirmed ✓' : 'Booking closed ✓')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <p className="text-center text-gray-400 py-20">Loading…</p>
  if (!booking) return <p className="text-center text-gray-400 py-20">Booking not found.</p>

  const statusInfo = STATUS_STYLE[booking.payment_status] ?? STATUS_STYLE.pending

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
          ['Kids (4–10)',   booking.kids],
          ['Booked via',    booking.booking_source === 'public' ? '📱 Public QR Form' : '🏪 POS Staff'],
          ['Submitted on',  booking.created_at?.toDate
            ? format(booking.created_at.toDate(), 'dd MMM yyyy, hh:mm a')
            : '—'],
        ].map(([k, v]) => (
          <div key={k} className="flex items-start justify-between text-sm gap-4">
            <span className="text-gray-500 flex-shrink-0">{k}</span>
            <span className="font-medium text-gray-800 dark:text-white text-right">{v}</span>
          </div>
        ))}
        {booking.remarks && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-400 mb-1">Remarks</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{booking.remarks}</p>
          </div>
        )}
      </div>

      {/* Payment details */}
      <div className="card p-4 space-y-2.5">
        <h2 className="section-title mb-1">Payment Details</h2>

        <div className="flex items-start justify-between text-sm gap-4">
          <span className="text-gray-500">Amount Paid</span>
          <span className="font-bold text-green-600 text-base">
            {booking.payment_amount ? `₹${booking.payment_amount}` : '—'}
          </span>
        </div>

        {booking.upi_id && (
          <div className="flex items-start justify-between text-sm gap-4">
            <span className="text-gray-500 flex-shrink-0">UPI ID</span>
            <span className="font-mono font-semibold text-gray-800 dark:text-white text-right break-all">
              {booking.upi_id}
            </span>
          </div>
        )}

        {/* Legacy: show old transaction_id if present */}
        {booking.transaction_id && !booking.upi_id && (
          <div className="flex items-start justify-between text-sm gap-4">
            <span className="text-gray-500 flex-shrink-0">Transaction ID</span>
            <span className="font-mono font-semibold text-gray-800 dark:text-white text-right break-all">
              {booking.transaction_id}
            </span>
          </div>
        )}

        {/* Receipt image */}
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

        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <p className="text-xs text-blue-600 font-medium">
            💡 Verify the receipt and UPI ID in your UPI app or bank statement before confirming payment.
          </p>
        </div>
      </div>

      {/* Accountant Actions */}
      <div className="space-y-2">
        {booking.payment_status === 'pending' && (
          <button
            onClick={() => updateStatus('confirmed')}
            disabled={updating}
            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} />
            {updating ? 'Confirming…' : 'Confirm Payment'}
          </button>
        )}

        {booking.payment_status === 'confirmed' && (
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

        {booking.payment_status === 'closed' && (
          <div className="card p-4 text-center bg-gray-50 dark:bg-gray-700">
            <p className="text-sm font-semibold text-gray-500">✓ This booking is closed</p>
          </div>
        )}
      </div>

    </div>
  )
}
