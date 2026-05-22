import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../../firebase'
import { Link } from 'react-router-dom'
import { Plus, Users, ArrowRight, BookOpen, Clock } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_COLOR = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  closed:    'bg-gray-100 text-gray-600',
}

export default function POSManagerDashboard() {
  const [stats, setStats]   = useState({})
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [bSnap, lSnap] = await Promise.all([
        getDocs(query(collection(db, 'bookings'), orderBy('created_at', 'desc'))),
        getDocs(collection(db, 'leads')),
      ])
      const bookings = bSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      const leads    = lSnap.docs.map(d => d.data())
      const pending  = bookings.filter(b => b.payment_status === 'pending').length

      setStats({ bookings: bookings.length, leads: leads.length, pending })
      setRecent(bookings.slice(0, 5))
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">POS Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/bookings/new"
          className="btn-primary flex items-center justify-center gap-2 py-4 text-base rounded-2xl">
          <Plus size={20} /> New Booking
        </Link>
        <Link to="/leads"
          className="btn-secondary flex items-center justify-center gap-2 py-4 text-base rounded-2xl">
          <Users size={20} /> Add Lead
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card items-center text-center">
          <BookOpen size={18} className="text-mango-500 mx-auto" />
          <p className="text-2xl font-bold text-mango-600 mt-1">{loading ? '…' : stats.bookings}</p>
          <p className="text-xs text-gray-500">Bookings</p>
        </div>
        <div className="stat-card items-center text-center">
          <Users size={18} className="text-violet-500 mx-auto" />
          <p className="text-2xl font-bold text-violet-600 mt-1">{loading ? '…' : stats.leads}</p>
          <p className="text-xs text-gray-500">Leads</p>
        </div>
        <div className="stat-card items-center text-center">
          <Clock size={18} className="text-yellow-500 mx-auto" />
          <p className="text-2xl font-bold text-yellow-600 mt-1">{loading ? '…' : stats.pending}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h2 className="section-title">Recent Bookings</h2>
          <Link to="/bookings" className="text-xs text-mango-600 font-medium flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {!loading && recent.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No bookings yet. Start adding!</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {recent.map(b => (
              <Link key={b.id} to={`/bookings/${b.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                    {b.firstname} {b.lastname}
                  </p>
                  <p className="text-xs text-gray-500">{b.booking_id}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${STATUS_COLOR[b.payment_status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {b.payment_status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
