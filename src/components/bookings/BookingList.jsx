import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { Search, BookOpen, ChevronRight, Filter, X } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_COLOR = {
  pending:      'bg-yellow-100 text-yellow-700',
  pos_approved: 'bg-blue-100 text-blue-700',
  confirmed:    'bg-green-100 text-green-700',
  closed:       'bg-gray-100 text-gray-600',
}
const STATUS_LABEL = {
  pending:      'Pending',
  pos_approved: 'POS Approved',
  confirmed:    'Confirmed',
  closed:       'Closed',
}

const FESTIVAL_DATES = [
  { value: '2026-06-07', label: '7 Jun 2026'  },
  { value: '2026-06-14', label: '14 Jun 2026' },
  { value: '2026-06-21', label: '21 Jun 2026' },
  { value: '2026-06-28', label: '28 Jun 2026' },
]

const PROMO_LABEL = {
  kid_free:    '🎁 Kids Offer',
  discount_15: '💰 15% Discount',
}

export default function BookingList() {
  const { role } = useAuth()
  const isAdmin  = role === 'super_admin' || role === 'accountant'

  const [bookings,  setBookings]  = useState([])
  const [locations, setLocations] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [dateFilter,   setDateFilter]   = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [promoFilter,  setPromoFilter]  = useState('all')

  useEffect(() => {
    async function load() {
      const [bSnap, lSnap] = await Promise.all([
        getDocs(query(collection(db, 'bookings'),      orderBy('created_at', 'desc'))),
        getDocs(collection(db, 'pos_locations')),
      ])
      setBookings(bSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLocations(lSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }
    load()
  }, [])

  // Location name lookup
  const locMap = Object.fromEntries(locations.map(l => [l.id, l.pos_name]))

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      `${b.firstname} ${b.lastname} ${b.phone} ${b.booking_id} ${b.email}`.toLowerCase().includes(q)
    const matchStatus   = statusFilter   === 'all' || b.payment_status  === statusFilter
    const matchMethod   = methodFilter   === 'all' || b.payment_method  === methodFilter
    const matchDate     = dateFilter     === 'all' || b.festival_date   === dateFilter
    const matchLocation = locationFilter === 'all' || b.pos_location    === locationFilter
    const matchPromo    = promoFilter    === 'all' ||
      (promoFilter === 'none' ? !b.promo_type : b.promo_type === promoFilter)
    return matchSearch && matchStatus && matchMethod && matchDate && matchLocation && matchPromo
  })

  const activeFilterCount = [
    statusFilter   !== 'all',
    methodFilter   !== 'all',
    dateFilter     !== 'all',
    locationFilter !== 'all',
    promoFilter    !== 'all',
  ].filter(Boolean).length

  function clearFilters() {
    setStatusFilter('all')
    setMethodFilter('all')
    setDateFilter('all')
    setLocationFilter('all')
    setPromoFilter('all')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Bookings</h1>
        {isAdmin && (
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl border transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'bg-mango-500 text-white border-mango-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-mango-400'
            }`}
          >
            <Filter size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-white text-mango-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Search row */}
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
        <select className="input-field w-36" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="pos_approved">POS Approved</option>
          <option value="confirmed">Confirmed</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Admin advanced filters */}
      {isAdmin && showFilters && (
        <div className="card p-4 space-y-3 border border-mango-100">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Advanced Filters</p>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                <X size={12} /> Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Payment method */}
            <div>
              <label className="label text-xs">Payment Method</label>
              <select className="input-field text-sm" value={methodFilter} onChange={e => setMethodFilter(e.target.value)}>
                <option value="all">All Methods</option>
                <option value="upi">📱 UPI / Online</option>
                <option value="cash">💵 Cash</option>
              </select>
            </div>

            {/* Festival date */}
            <div>
              <label className="label text-xs">Festival Date</label>
              <select className="input-field text-sm" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
                <option value="all">All Dates</option>
                {FESTIVAL_DATES.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="label text-xs">Booking Location</label>
              <select className="input-field text-sm" value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
                <option value="all">All Locations</option>
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.pos_name}</option>
                ))}
              </select>
            </div>

            {/* Promo */}
            <div>
              <label className="label text-xs">Promo Offer</label>
              <select className="input-field text-sm" value={promoFilter} onChange={e => setPromoFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="kid_free">🎁 Kids Offer</option>
                <option value="discount_15">💰 15% Discount</option>
                <option value="none">No Promo</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Count */}
      {!loading && (
        <p className="text-xs text-gray-400">
          {filtered.length} booking{filtered.length !== 1 ? 's' : ''}
          {activeFilterCount > 0 && ' (filtered)'}
        </p>
      )}

      {/* List */}
      {loading ? (
        <p className="text-center text-gray-400 py-10">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No bookings found.</p>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="btn-secondary mt-3 text-sm">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map(b => (
              <Link key={b.id} to={`/bookings/${b.id}`}
                className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-mango-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-mango-700 font-bold text-sm">
                    {(b.firstname?.[0] ?? '?').toUpperCase()}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                    {b.firstname} {b.lastname}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">{b.booking_id}</p>

                  {/* Admin extra info */}
                  {isAdmin && (
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                      {b.phone && (
                        <span className="text-xs text-gray-500">📞 {b.phone}</span>
                      )}
                      {b.pos_location && locMap[b.pos_location] && (
                        <span className="text-xs text-gray-500">📍 {locMap[b.pos_location]}</span>
                      )}
                      {b.festival_date && (
                        <span className="text-xs text-gray-500">
                          🗓 {format(new Date(b.festival_date), 'd MMM yyyy')}
                        </span>
                      )}
                      {b.adults != null && (
                        <span className="text-xs text-gray-500">
                          👥 {b.adults} adults{b.kids > 0 ? `, ${b.kids} kids` : ''}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right side */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[b.payment_status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABEL[b.payment_status] ?? b.payment_status}
                  </span>
                  <div className="flex items-center gap-1">
                    {b.payment_method === 'cash'
                      ? <span className="text-xs text-gray-400">💵</span>
                      : <span className="text-xs text-gray-400">📱</span>
                    }
                    {b.payment_amount && (
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                        ₹{b.payment_amount}
                      </span>
                    )}
                  </div>
                  {b.promo_type && (
                    <span className="text-xs text-mango-500 font-medium">
                      {PROMO_LABEL[b.promo_type] ?? b.promo_type}
                    </span>
                  )}
                  <p className="text-xs text-gray-400">
                    {b.created_at?.toDate ? format(b.created_at.toDate(), 'dd MMM') : '—'}
                  </p>
                </div>

                <ChevronRight size={14} className="text-gray-300 ml-1 mt-2 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
