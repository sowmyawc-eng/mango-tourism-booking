import { Menu, Sun, Moon, MessageCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import NotificationBell from './NotificationBell'

const PAGE_TITLES = {
  '/dashboard':            'Dashboard',
  '/admin/dashboard':      'Dashboard',
  '/pos/dashboard':        'POS Dashboard',
  '/accountant/dashboard': 'Payment Verification',
  '/admin/activity':       'Activity Report',
  '/leads':                'Leads',
  '/bookings':             'Bookings',
  '/users':                'User Management',
  '/pos-locations':        'POS Locations',
  '/promo-codes':          'Promo Codes',
  '/calculator':           'Ticket Calculator',
  '/messages':             'Messages',
}

export default function TopBar({ onMenuClick }) {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const location = useLocation()
  const navigate  = useNavigate()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const title = PAGE_TITLES[location.pathname] ?? 'Mango Tourism'

  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <Menu size={20} />
      </button>

      <h1 className="flex-1 text-base font-bold text-gray-800 dark:text-white">{title}</h1>

      {/* Messages shortcut */}
      <button
        onClick={() => navigate('/messages')}
        className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Messages"
      >
        <MessageCircle size={18} />
      </button>

      {/* Notification bell */}
      <NotificationBell />

      {/* Dark mode toggle */}
      <button
        onClick={() => setDark(v => !v)}
        className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Toggle dark mode"
      >
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </header>
  )
}
