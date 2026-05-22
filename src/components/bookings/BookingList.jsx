import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../../firebase'
import { Link } from 'react-router-dom'
import { Search, BookOpen, Plus, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_COLOR = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  closed:    'bg-gray-100 text-gray-600',
}

export default function BookingList() {
  const [bookings, setBookings]   = useState([])
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatus] = useState('all')
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    getDocs(query(collection(db, 'bookings'), orderBy('created_at', 'desc'))).then(snap => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [])

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      `${b.firstname} ${b.lastname} ${b.phone} ${b.booking_id} ${b.email}`.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || b.payment_status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Bookings</h1>
        <Link to="/bookings/new" className="btn-primary btn-sm flex items-center gap-1.5">
          <Plus size={15} /> New
        </Link>
      </div>

      {/* Search + filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input-field pl-9"
            placeholder="Name, phone, email, booking ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input-field w-36" value={statusFilter} onChange={e => setStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {!loading && (
        <p className="text-xs text-gray-400">{filtered.length} booking{filtered.length !== 1 ? 's' : ''}</p>
      )}

      {loading ? (
        <p className="text-center text-gray-400 py-10">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">No bookings found.</p>
          <Link to="/bookings/new" className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} /> Create first booking
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map(b => (
              <Link key={b.id} to={`/bookings/${b.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                    {b.firstname} {b.lastname}
                  </p>
                  <p className="text-xs text-gray-500">
                    {b.booking_id} · {b.adults}A {b.kids}K
                    {b.festival_date ? ` · ${b.festival_date}` : ''}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLOR[b.payment_status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {b.payment_status}
                  </span>
                  <p className="text-xs text-gray-400">
                    {b.created_at?.toDate ? format(b.created_at.toDate(), 'dd MMM') : '—'}
                  </p>
                </div>
                <ChevronRight size={14} className="text-gray-300 ml-1" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
