import { Menu, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const PAGE_TITLES = {
  '/dashboard':            'Dashboard',
  '/pos/dashboard':        'POS Dashboard',
  '/accountant/dashboard': 'Payment Verification',
  '/leads':                'Leads',
  '/bookings':             'Bookings',
  '/bookings/new':         'New Booking',
  '/users':                'User Management',
  '/pos-locations':        'POS Locations',
}

export default function TopBar({ onMenuClick }) {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const location = useLocation()

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
