import { useEffect, useState } from 'react'
import {
  collection, getDocs, query,
  orderBy, limit,
} from 'firebase/firestore'
import { db } from '../../firebase'
import { format, formatDistanceToNow } from 'date-fns'
import {
  BarChart2, CheckCircle, XCircle, ThumbsUp,
  Users, RefreshCw, LogIn, UserPlus, Clock,
} from 'lucide-react'

const ROLE_LABEL = { super_admin: 'Super Admin', pos_manager: 'POS Manager', accountant: 'Accountant' }
const ROLE_COLOR = {
  super_admin: 'bg-purple-100 text-purple-700',
  pos_manager: 'bg-mango-100 text-mango-700',
  accountant:  'bg-blue-100 text-blue-700',
}

// ── Section toggle tabs ────────────────────────────────────────────────────
const TABS = [
  { key: 'actions',  label: 'Booking Actions', icon: BarChart2  },
  { key: 'logins',   label: 'Login Activity',  icon: LogIn      },
  { key: 'created',  label: 'User Creation',   icon: UserPlus   },
]

export default function UserActivityReport() {
  const [users,         setUsers]         = useState([])
  const [bookings,      setBookings]      = useState([])
  const [loginActivity, setLoginActivity] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [tab,           setTab]           = useState('actions')

  async function load() {
    setLoading(true)
    const [usersSnap, bookingsSnap, loginSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(query(collection(db, 'bookings'), orderBy('created_at', 'desc'))),
      getDocs(query(collection(db, 'login_activity'), orderBy('logged_in_at', 'desc'), limit(200))),
    ])
    setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    setBookings(bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoginActivity(loginSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // ── Booking action stats per user ─────────────────────────────────────────
  function bookingStatsFor(uid) {
    const posApproved = bookings.filter(b => b.pos_approved_by === uid).length
    const confirmed   = bookings.filter(b => b.confirmed_by    === uid).length
    const closed      = bookings.filter(b => b.closed_by       === uid).length
    return { posApproved, confirmed, closed, total: posApproved + confirmed + closed }
  }

  // ── Login stats per user ──────────────────────────────────────────────────
  function loginStatsFor(uid) {
    const events   = loginActivity.filter(l => l.uid === uid)
    const count    = events.length
    const lastEvent = events[0]   // already sorted desc
    const lastLogin = lastEvent?.logged_in_at?.toDate?.() ?? null
    return { count, lastLogin, events }
  }

  // ── Summary totals ────────────────────────────────────────────────────────
  const totalBookings  = bookings.length
  const totalConfirmed = bookings.filter(b => ['confirmed','closed'].includes(b.payment_status)).length
  const totalClosed    = bookings.filter(b => b.payment_status === 'closed').length
  const totalLogins    = loginActivity.length

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BarChart2 size={20} className="text-mango-500" /> User Activity Report
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Staff performance, login history &amp; user creation · {format(new Date(), 'dd MMM yyyy')}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-mango-600 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-mango-300 transition-colors">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{loading ? '…' : totalBookings}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Bookings</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{loading ? '…' : totalConfirmed}</p>
          <p className="text-xs text-gray-500 mt-0.5">Confirmed</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-gray-500">{loading ? '…' : totalClosed}</p>
          <p className="text-xs text-gray-500 mt-0.5">Closed</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-mango-600">{loading ? '…' : totalLogins}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Logins</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === key
                ? 'bg-white dark:bg-gray-700 text-mango-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-12 text-sm">Loading activity…</p>
      ) : (
        <>
          {/* ── TAB: Booking Actions ─────────────────────────────────────────── */}
          {tab === 'actions' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 font-medium">
                Actions recorded from the moment this feature was enabled. Older bookings will show 0.
              </p>
              {users
                .map(u => ({ ...u, stats: bookingStatsFor(u.id) }))
                .sort((a, b) => b.stats.total - a.stats.total)
                .map(user => (
                  <div key={user.id} className="card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-mango-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-mango-700 font-bold text-sm">
                            {(user.name?.[0] ?? '?').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 dark:text-white">{user.name}</p>
                          <p className="text-xs text-gray-400">@{user.username ?? '—'}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ROLE_COLOR[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {ROLE_LABEL[user.role] ?? user.role}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3 text-center">
                        <ThumbsUp size={13} className="text-blue-500 mx-auto mb-1" />
                        <p className="text-xl font-bold text-blue-700">{user.stats.posApproved}</p>
                        <p className="text-xs text-blue-500 leading-tight mt-0.5">Cash<br/>Approved</p>
                      </div>
                      <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-3 text-center">
                        <CheckCircle size={13} className="text-green-500 mx-auto mb-1" />
                        <p className="text-xl font-bold text-green-700">{user.stats.confirmed}</p>
                        <p className="text-xs text-green-500 leading-tight mt-0.5">Payments<br/>Confirmed</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 dark:bg-gray-700/30 p-3 text-center">
                        <XCircle size={13} className="text-gray-400 mx-auto mb-1" />
                        <p className="text-xl font-bold text-gray-600">{user.stats.closed}</p>
                        <p className="text-xs text-gray-400 leading-tight mt-0.5">Bookings<br/>Closed</p>
                      </div>
                    </div>

                    {user.stats.total > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Total actions</span>
                          <span className="font-bold text-mango-600">{user.stats.total}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden flex">
                          {user.stats.posApproved > 0 && (
                            <div className="bg-blue-400 h-full" style={{ width: `${(user.stats.posApproved / user.stats.total) * 100}%` }} />
                          )}
                          {user.stats.confirmed > 0 && (
                            <div className="bg-green-400 h-full" style={{ width: `${(user.stats.confirmed / user.stats.total) * 100}%` }} />
                          )}
                          {user.stats.closed > 0 && (
                            <div className="bg-gray-400 h-full" style={{ width: `${(user.stats.closed / user.stats.total) * 100}%` }} />
                          )}
                        </div>
                      </div>
                    )}
                    {user.stats.total === 0 && (
                      <p className="text-xs text-gray-400 text-center mt-2 italic">No actions recorded yet</p>
                    )}
                  </div>
                ))
              }
            </div>
          )}

          {/* ── TAB: Login Activity ──────────────────────────────────────────── */}
          {tab === 'logins' && (
            <div className="space-y-3">
              {/* Per-user last login summary */}
              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="section-title flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" /> Last Login per User
                  </h2>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {users
                    .map(u => ({ ...u, ls: loginStatsFor(u.id) }))
                    .sort((a, b) => (b.ls.lastLogin?.getTime() ?? 0) - (a.ls.lastLogin?.getTime() ?? 0))
                    .map(user => (
                      <div key={user.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-mango-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-mango-700 font-bold text-xs">
                            {(user.name?.[0] ?? '?').toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{user.name}</p>
                          <p className="text-xs text-gray-400">
                            @{user.username ?? '—'} ·&nbsp;
                            <span className={`font-medium ${ROLE_COLOR[user.role]?.split(' ')[1] ?? 'text-gray-500'}`}>
                              {ROLE_LABEL[user.role] ?? user.role}
                            </span>
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {user.ls.lastLogin ? (
                            <>
                              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                                {format(user.ls.lastLogin, 'dd MMM, hh:mm a')}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDistanceToNow(user.ls.lastLogin, { addSuffix: true })} · {user.ls.count} login{user.ls.count !== 1 ? 's' : ''}
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-gray-400 italic">Never logged in</p>
                          )}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Full login log */}
              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="section-title flex items-center gap-2">
                    <LogIn size={14} className="text-gray-400" /> Recent Login Log
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold ml-1">
                      Last {loginActivity.length}
                    </span>
                  </h2>
                </div>
                {loginActivity.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm italic">No login events recorded yet</p>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-96 overflow-y-auto">
                    {loginActivity.map(event => {
                      const userInfo = users.find(u => u.id === event.uid)
                      const ts = event.logged_in_at?.toDate?.()
                      return (
                        <div key={event.id} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <LogIn size={12} className="text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                              {userInfo?.name ?? event.username ?? 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-400">
                              @{event.username ?? '—'}
                              {userInfo?.role && (
                                <> · {ROLE_LABEL[userInfo.role] ?? userInfo.role}</>
                              )}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {ts ? (
                              <>
                                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                                  {format(ts, 'dd MMM, hh:mm a')}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {formatDistanceToNow(ts, { addSuffix: true })}
                                </p>
                              </>
                            ) : (
                              <p className="text-xs text-gray-400">—</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: User Creation ───────────────────────────────────────────── */}
          {tab === 'created' && (
            <div className="space-y-3">
              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="section-title flex items-center gap-2">
                    <UserPlus size={14} className="text-gray-400" /> All Staff Accounts
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold ml-1">
                      {users.length}
                    </span>
                  </h2>
                </div>
                {users.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm italic">No users found</p>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {users
                      .slice()
                      .sort((a, b) => {
                        const ta = a.created_at?.toDate?.()?.getTime() ?? 0
                        const tb = b.created_at?.toDate?.()?.getTime() ?? 0
                        return tb - ta
                      })
                      .map(user => {
                        const createdAt = user.created_at?.toDate?.()
                        return (
                          <div key={user.id} className="px-4 py-3">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-full bg-mango-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-mango-700 font-bold text-sm">
                                  {(user.name?.[0] ?? '?').toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-bold text-gray-800 dark:text-white">{user.name}</p>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ROLE_COLOR[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                                    {ROLE_LABEL[user.role] ?? user.role}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                                    {user.active !== false ? 'Active' : 'Inactive'}
                                  </span>
                                </div>

                                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                                  <p className="text-xs text-gray-400 font-mono">@{user.username ?? '—'}</p>
                                  {user.email && <p className="text-xs text-gray-400">✉️ {user.email}</p>}
                                </div>

                                <div className="mt-2 flex flex-wrap gap-3">
                                  {createdAt && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                      <span className="w-5 h-5 bg-mango-100 rounded-full flex items-center justify-center">
                                        <UserPlus size={10} className="text-mango-600" />
                                      </span>
                                      <span>
                                        Created {format(createdAt, 'dd MMM yyyy, hh:mm a')}
                                        {' '}
                                        <span className="text-gray-400">
                                          ({formatDistanceToNow(createdAt, { addSuffix: true })})
                                        </span>
                                      </span>
                                    </div>
                                  )}
                                  {user.created_by_name && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                      <span className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                                        <Users size={10} className="text-purple-600" />
                                      </span>
                                      <span>Created by <span className="font-semibold text-gray-700 dark:text-gray-200">{user.created_by_name}</span></span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    }
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
