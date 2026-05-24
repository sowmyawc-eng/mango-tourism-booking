import { useEffect, useState } from 'react'
import { collection, getDocs, query, deleteDoc, doc, orderBy } from 'firebase/firestore'
import { db } from '../../firebase'
import { Plus, Search, Pencil, Trash2, User, Filter, X } from 'lucide-react'
import { format, isAfter, isBefore, parseISO, startOfDay } from 'date-fns'
import LeadForm from './LeadForm'
import { useAuth } from '../../contexts/AuthContext'

const STATUS_MAP = {
  new_lead:   { label: 'New Lead',         color: 'bg-blue-100 text-blue-700'     },
  interested: { label: 'Interested',       color: 'bg-green-100 text-green-700'   },
  follow_up:  { label: 'Follow-up Needed', color: 'bg-orange-100 text-orange-700' },
}

export default function LeadList() {
  const { role, userProfile } = useAuth()
  const isAdmin  = role === 'super_admin'
  const isPOS    = role === 'pos_manager'

  const [leads, setLeads]     = useState([])
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]  = useState(null)

  async function loadLeads() {
    const snap = await getDocs(query(collection(db, 'leads'), orderBy('created_at', 'desc')))
    setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { loadLeads() }, [])

  const activeFilterCount = [filter !== 'all', !!dateFrom, !!dateTo].filter(Boolean).length

  const filtered = leads.filter(l => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      `${l.firstname} ${l.lastname} ${l.phone} ${l.email}`.toLowerCase().includes(q)
    const matchFilter = filter === 'all' || l.status === filter
    const createdDate = l.created_at?.toDate ? l.created_at.toDate() : null
    const matchFrom = !dateFrom || !createdDate || !isBefore(createdDate, startOfDay(parseISO(dateFrom)))
    const matchTo   = !dateTo   || !createdDate || !isAfter(createdDate,  startOfDay(parseISO(dateTo + 'T23:59:59')))
    // POS managers only see leads from their own assigned location
    const matchLocation = !isPOS || (l.pos_location === userProfile?.assigned_pos)
    return matchSearch && matchFilter && matchFrom && matchTo && matchLocation
  })

  async function deleteLead(id) {
    if (!confirm('Delete this lead?')) return
    await deleteDoc(doc(db, 'leads', id))
    loadLeads()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Leads</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="btn-primary btn-sm flex items-center gap-1.5"
        >
          <Plus size={15} /> Add Lead
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input-field pl-9"
            placeholder="Search by name, phone or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input-field w-36" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="new_lead">New Lead</option>
          <option value="interested">Interested</option>
          <option value="follow_up">Follow-up</option>
        </select>
        {isAdmin && (
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 rounded-xl border text-sm font-medium transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'bg-mango-500 text-white border-mango-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-mango-400'
            }`}
          >
            <Filter size={14} />
            {activeFilterCount > 0 && (
              <span className="bg-white text-mango-600 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Date range filters (admin) */}
      {isAdmin && showFilters && (
        <div className="card p-3 border border-mango-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date Range</p>
            {activeFilterCount > 0 && (
              <button onClick={() => { setFilter('all'); setDateFrom(''); setDateTo('') }}
                className="text-xs text-red-500 flex items-center gap-1">
                <X size={12} /> Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label text-xs">From</label>
              <input type="date" className="input-field text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="label text-xs">To</label>
              <input type="date" className="input-field text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <p className="text-xs text-gray-400">
          {filtered.length} lead{filtered.length !== 1 ? 's' : ''}
          {activeFilterCount > 0 && ' (filtered)'}
        </p>
      )}

      {loading ? (
        <p className="text-center text-gray-400 py-10">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <User size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No leads found.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map(l => {
              const s = STATUS_MAP[l.status] ?? { label: l.status, color: 'bg-gray-100 text-gray-600' }
              return (
                <div key={l.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-violet-700 font-bold text-sm">
                      {l.firstname?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                      {l.firstname} {l.lastname}
                    </p>
                    <p className="text-xs text-gray-500">{l.phone} · {l.email}</p>
                    {l.pos_location && (
                      <p className="text-xs text-mango-600 font-medium mt-0.5">📍 {l.pos_location}</p>
                    )}
                    {l.notes && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{l.notes}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>
                      {s.label}
                    </span>
                    <p className="text-xs text-gray-400">
                      {l.created_at?.toDate ? format(l.created_at.toDate(), 'dd MMM') : '—'}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-1">
                    <button
                      onClick={() => { setEditing(l); setShowForm(true) }}
                      className="p-1.5 text-gray-400 hover:text-mango-600 rounded-lg"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => deleteLead(l.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showForm && (
        <LeadForm
          existing={editing}
          onClose={() => setShowForm(false)}
          onSaved={loadLeads}
        />
      )}
    </div>
  )
}
