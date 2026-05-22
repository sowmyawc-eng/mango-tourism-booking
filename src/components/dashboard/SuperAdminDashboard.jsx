import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../../firebase'
import { Link } from 'react-router-dom'
import { Users, BookOpen, Clock, TrendingUp, MapPin, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value ?? '—'}</p>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
    </div>
  )
}

const STATUS_COLOR = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  closed:    'bg-gray-100 text-gray-600',
}

export default function SuperAdminDashboard() {
  const [stats, setStats]       = useState({})
  const [recent, setRecent]     = useState([])
  const [posStats, setPosStats] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const [bSnap, lSnap, posSnap] = await Promise.all([
        getDocs(query(collection(db, 'bookings'), orderBy('created_at', 'desc'))),
        getDocs(collection(db, 'leads')),
        getDocs(collection(db, 'pos_locations')),
      ])

      const bookings = bSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      const leads    = lSnap.docs.map(d => ({ id: d.id, ...d.data() }))

      const pending   = bookings.filter(b => b.payment_status === 'pending').length
      const confirmed = bookings.filter(b => b.payment_status === 'confirmed').length

      // POS performance
      const posMap = {}
      posSnap.docs.forEach(d => { posMap[d.id] = { name: d.data().pos_name, count: 0 } })
      bookings.forEach(b => { if (b.pos_location && posMap[b.pos_location]) posMap[b.pos_location].count++ })

      setStats({ total: bookings.length, leads: leads.length, pending, confirmed })
      setRecent(bookings.slice(0, 6))
      setPosStats(Object.values(posMap).sort((a, b) => b.count - a.count))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p className="text-center text-gray-400 py-20">Loading…</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Overview</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users}      label="Total Leads"     value={stats.leads}     color="bg-violet-500" />
        <StatCard icon={BookOpen}   label="Total Bookings"  value={stats.total}     color="bg-mango-500"  />
        <StatCard icon={Clock}      label="Pending Payment" value={stats.pending}   color="bg-yellow-500" />
        <StatCard icon={TrendingUp} label="Confirmed"       value={stats.confirmed} color="bg-green-500"  />
      </div>

      {/* Recent bookings */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h2 className="section-title">Recent Bookings</h2>
          <Link to="/bookings" className="text-xs text-mango-600 font-medium flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No bookings yet</p>
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

      {/* POS performance */}
      {posStats.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <MapPin size={16} className="text-mango-500" />
            <h2 className="section-title">POS Performance</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {posStats.map((p, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{p.name}</p>
                </div>
                <span className="text-sm font-bold text-mango-600">{p.count} bookings</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
