import { useEffect, useRef, useState } from 'react'
import {
  collection, getDocs, query, where, orderBy,
  onSnapshot, addDoc, serverTimestamp, doc, updateDoc, writeBatch,
} from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import { Send, ArrowLeft, MessageCircle } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'

const ROLE_LABEL = { super_admin: 'Super Admin', pos_manager: 'POS Manager', accountant: 'Accountant' }
const ROLE_COLOR = {
  super_admin: 'bg-purple-100 text-purple-700',
  pos_manager: 'bg-mango-100 text-mango-700',
  accountant:  'bg-blue-100 text-blue-700',
}

function convId(uid1, uid2) { return [uid1, uid2].sort().join('__') }

function msgDate(ts) {
  if (!ts?.toDate) return ''
  const d = ts.toDate()
  if (isToday(d))     return format(d, 'hh:mm a')
  if (isYesterday(d)) return `Yesterday ${format(d, 'hh:mm a')}`
  return format(d, 'dd MMM, hh:mm a')
}

export default function MessagingPage() {
  const { currentUser, userProfile } = useAuth()

  const [users,        setUsers]        = useState([])
  const [selected,     setSelected]     = useState(null)   // selected user object
  const [messages,     setMessages]     = useState([])
  const [unreadMap,    setUnreadMap]    = useState({})     // uid → unread count
  const [text,         setText]         = useState('')
  const [sending,      setSending]      = useState(false)
  const [mobileView,   setMobileView]   = useState('list') // 'list' | 'chat'

  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Load all other users
  useEffect(() => {
    getDocs(collection(db, 'users')).then(snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.id !== currentUser.uid))
    })
  }, [currentUser.uid])

  // Listen to unread counts across all conversations
  useEffect(() => {
    if (!currentUser) return
    const q = query(
      collection(db, 'messages'),
      where('to_uid', '==', currentUser.uid),
      where('read', '==', false),
    )
    return onSnapshot(q, snap => {
      const map = {}
      snap.docs.forEach(d => {
        const { from_uid } = d.data()
        map[from_uid] = (map[from_uid] ?? 0) + 1
      })
      setUnreadMap(map)
    })
  }, [currentUser])

  // Listen to messages for selected conversation
  useEffect(() => {
    if (!selected || !currentUser) return
    const cid = convId(currentUser.uid, selected.id)
    const q = query(
      collection(db, 'messages'),
      where('conversation_id', '==', cid),
      orderBy('created_at', 'asc'),
    )
    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      // Mark received messages as read
      const batch = writeBatch(db)
      snap.docs.forEach(d => {
        if (d.data().to_uid === currentUser.uid && !d.data().read) {
          batch.update(doc(db, 'messages', d.id), { read: true })
        }
      })
      batch.commit().catch(() => {})
    })
  }, [selected, currentUser])

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!text.trim() || !selected || sending) return
    setSending(true)
    try {
      const cid = convId(currentUser.uid, selected.id)
      await addDoc(collection(db, 'messages'), {
        conversation_id: cid,
        from_uid:        currentUser.uid,
        from_name:       userProfile?.name ?? 'Unknown',
        from_role:       userProfile?.role ?? '',
        to_uid:          selected.id,
        to_name:         selected.name,
        text:            text.trim(),
        read:            false,
        created_at:      serverTimestamp(),
      })
      // Send notification to recipient
      await addDoc(collection(db, 'notifications'), {
        to_uid:     selected.id,
        from_uid:   currentUser.uid,
        from_name:  userProfile?.name ?? 'Unknown',
        type:       'message',
        title:      `New message from ${userProfile?.name ?? 'Unknown'}`,
        body:       text.trim().length > 60 ? text.trim().slice(0, 60) + '…' : text.trim(),
        read:       false,
        created_at: serverTimestamp(),
      })
      setText('')
      inputRef.current?.focus()
    } finally {
      setSending(false)
    }
  }

  function selectUser(u) {
    setSelected(u)
    setMessages([])
    setMobileView('chat')
  }

  const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0)

  // ── User list ─────────────────────────────────────────────────────────────
  const UserList = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-700">
        <h1 className="page-title flex items-center gap-2">
          <MessageCircle size={18} className="text-mango-500" /> Messages
          {totalUnread > 0 && (
            <span className="text-xs bg-red-500 text-white font-bold px-2 py-0.5 rounded-full">
              {totalUnread}
            </span>
          )}
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">Direct messages with your team</p>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
        {users.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-10">No other users found</p>
        )}
        {users.map(u => (
          <button
            key={u.id}
            onClick={() => selectUser(u)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors text-left ${
              selected?.id === u.id ? 'bg-mango-50 dark:bg-mango-900/20' : ''
            }`}
          >
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-mango-100 flex items-center justify-center">
                <span className="text-mango-700 font-bold text-sm">
                  {(u.name?.[0] ?? '?').toUpperCase()}
                </span>
              </div>
              {unreadMap[u.id] > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadMap[u.id] > 9 ? '9+' : unreadMap[u.id]}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${
                unreadMap[u.id] > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
              }`}>{u.name}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLOR[u.role] ?? 'bg-gray-100 text-gray-500'}`}>
                {ROLE_LABEL[u.role] ?? u.role}
              </span>
            </div>
            {unreadMap[u.id] > 0 && (
              <span className="w-2 h-2 rounded-full bg-mango-500 flex-shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  )

  // ── Chat view ─────────────────────────────────────────────────────────────
  const ChatView = () => (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
        <button
          onClick={() => setMobileView('list')}
          className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="w-9 h-9 rounded-full bg-mango-100 flex items-center justify-center flex-shrink-0">
          <span className="text-mango-700 font-bold text-sm">
            {(selected?.name?.[0] ?? '?').toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800 dark:text-white">{selected?.name}</p>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLOR[selected?.role] ?? 'bg-gray-100 text-gray-500'}`}>
            {ROLE_LABEL[selected?.role] ?? selected?.role}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle size={32} className="mx-auto text-gray-200 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-400">No messages yet. Say hello!</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMine = msg.from_uid === currentUser.uid
          const showDate = i === 0 || (
            messages[i-1].created_at?.toDate?.()?.toDateString() !== msg.created_at?.toDate?.()?.toDateString()
          )
          return (
            <div key={msg.id}>
              {showDate && msg.created_at?.toDate && (
                <div className="text-center my-2">
                  <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                    {isToday(msg.created_at.toDate()) ? 'Today' :
                     isYesterday(msg.created_at.toDate()) ? 'Yesterday' :
                     format(msg.created_at.toDate(), 'dd MMMM yyyy')}
                  </span>
                </div>
              )}
              <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                  isMine
                    ? 'bg-mango-500 text-white rounded-br-sm'
                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-600 rounded-bl-sm'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? 'text-mango-100 text-right' : 'text-gray-400'}`}>
                    {msgDate(msg.created_at)}
                    {isMine && <span className="ml-1">{msg.read ? ' ✓✓' : ' ✓'}</span>}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            className="input-field flex-1"
            placeholder={`Message ${selected?.name}…`}
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            className="btn-primary px-4 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-[calc(100vh-65px)] flex gap-0 -m-4 lg:-m-6 overflow-hidden">

      {/* User list panel */}
      <div className={`w-full lg:w-72 lg:flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col
        ${mobileView === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
        <UserList />
      </div>

      {/* Chat panel */}
      <div className={`flex-1 bg-gray-50 dark:bg-gray-900 flex flex-col
        ${mobileView === 'list' && !selected ? 'hidden lg:flex' : 'flex'}`}>
        {selected ? (
          <ChatView />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 hidden lg:flex">
            <MessageCircle size={48} className="text-gray-200 dark:text-gray-600 mb-4" />
            <p className="text-gray-400 font-medium">Select a person to start messaging</p>
          </div>
        )}
      </div>
    </div>
  )
}
