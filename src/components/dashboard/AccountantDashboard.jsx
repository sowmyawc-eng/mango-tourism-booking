import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../../firebase'
import { Link } from 'react-router-dom'
import { Clock, CheckCircle, XCircle, BookOpen, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'

export default function AccountantDashboard() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    getDocs(query(collection(db, 'bookings'), orderBy('created_at', 'desc'))).then(snap => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [])

  const pending   = bookings.filter(b => b.payment_status === 'pending')
  const confirmed = bookings.filter(b => b.payment_status === 'confirmed')
  const closed    = bookings.filter(b => b.payment_status === 'closed')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Payment Verification</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card items-center text-center">
          <Clock size={18} className="text-yellow-500 mx-auto" />
          <p className="text-2xl font-bold text-yellow-600 mt-1">{loading ? '…' : pending.length}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
        <div className="stat-card items-center text-center">
          <CheckCircle size={18} className="text-green-500 mx-auto" />
          <p className="text-2xl font-bold text-green-600 mt-1">{loading ? '…' : confirmed.length}</p>
          <p className="text-xs text-gray-500">Confirmed</p>
        </div>
        <div className="stat-card items-center text-center">
          <XCircle size={18} className="text-gray-400 mx-auto" />
          <p className="text-2xl font-bold text-gray-600 mt-1">{loading ? '…' : closed.length}</p>
          <p className="text-xs text-gray-500">Closed</p>
        </div>
      </div>

      {/* Pending queue — action-first view */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h2 className="section-title">🔔 Needs Verification</h2>
            {pending.length > 0 && (
              <span className="text-xs bg-yellow-500 text-white font-bold px-2 py-0.5 rounded-full">
                {pending.length}
              </span>
            )}
          </div>
          <Link to="/bookings" className="text-xs text-mango-600 font-medium flex items-center gap-1">
            All bookings <ArrowRight size={12} />
          </Link>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-8 text-sm">Loading…</p>
        ) : pending.length === 0 ? (
          <p className="text-center text-green-600 py-8 text-sm font-semibold">
            ✓ All payments verified!
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {pending.map(b => (
              <Link key={b.id} to={`/bookings/${b.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-yellow-50 dark:hover:bg-yellow-900/10">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                    {b.firstname} {b.lastname}
                  </p>
                  <p className="text-xs text-gray-500">
                    {b.booking_id} · {b.adults}A {b.kids}K
                    {b.booking_source === 'public' ? ' · 📱 Public' : ' · 🏪 POS'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-yellow-100 text-yellow-700">
                    Pending
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    {b.created_at?.toDate ? format(b.created_at.toDate(), 'dd MMM, hh:mm a') : '—'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Confirmed but not yet closed */}
      {confirmed.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <h2 className="section-title">✅ Confirmed — Awaiting Close ({confirmed.length})</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {confirmed.map(b => (
              <Link key={b.id} to={`/bookings/${b.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 dark:hover:bg-green-900/10">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                    {b.firstname} {b.lastname}
                  </p>
                  <p className="text-xs text-gray-500">{b.booking_id}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700">
                  Confirmed
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
