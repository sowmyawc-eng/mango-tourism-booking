import { useEffect, useRef, useState } from 'react'
import {
  collection, query, where, orderBy, limit,
  onSnapshot, updateDoc, doc, writeBatch,
} from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import { Bell, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const TYPE_ICON = {
  password_reset: '🔑',
  message:        '💬',
  booking:        '📋',
  system:         '📢',
}

export default function NotificationBell() {
  const { currentUser } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [open, setOpen]                   = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!currentUser) return
    const q = query(
      collection(db, 'notifications'),
      where('to_uid', '==', currentUser.uid),
      orderBy('created_at', 'desc'),
      limit(30),
    )
    return onSnapshot(q, snap => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [currentUser])

  // Close when clicking outside
  useEffect(() => {
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unread = notifications.filter(n => !n.read).length

  async function markAllRead() {
    const batch = writeBatch(db)
    notifications.filter(n => !n.read).forEach(n => {
      batch.update(doc(db, 'notifications', n.id), { read: true })
    })
    await batch.commit()
  }

  async function markRead(id) {
    await updateDoc(doc(db, 'notifications', id), { read: true })
  }

  function handleOpen() {
    setOpen(v => !v)
    if (!open && unread > 0) markAllRead()
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white">
              Notifications {unread > 0 && <span className="text-xs text-red-500 font-bold">({unread} new)</span>}
            </h3>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
              <X size={14} />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No notifications yet</p>
            ) : notifications.map(n => (
              <div
                key={n.id}
                className={`px-4 py-3 flex gap-3 items-start transition-colors ${
                  !n.read ? 'bg-mango-50 dark:bg-mango-900/10' : ''
                }`}
              >
                <span className="text-base flex-shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 dark:text-white">{n.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {n.created_at?.toDate ? formatDistanceToNow(n.created_at.toDate(), { addSuffix: true }) : '—'}
                  </p>
                </div>
                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-mango-500 flex-shrink-0 mt-1.5" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
