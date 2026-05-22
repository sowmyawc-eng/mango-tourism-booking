import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, MapPin, ClipboardList,
  BookOpen, Leaf, CheckSquare, UserCog
} from 'lucide-react'

const NAV_SECTIONS = [
  {
    label: 'Overview',
    links: [
      { to: '/dashboard',            icon: LayoutDashboard, label: 'Main Dashboard'   },
    ]
  },
  {
    label: 'POS Staff',
    links: [
      { to: '/pos/dashboard',        icon: Leaf,            label: 'POS Dashboard'    },
      { to: '/bookings/new',         icon: BookOpen,        label: 'New Booking'      },
      { to: '/leads',                icon: ClipboardList,   label: 'Leads'            },
    ]
  },
  {
    label: 'Accountant',
    links: [
      { to: '/accountant/dashboard', icon: CheckSquare,     label: 'Verify Payments'  },
      { to: '/bookings',             icon: BookOpen,        label: 'All Bookings'     },
    ]
  },
  {
    label: 'Admin',
    links: [
      { to: '/users',                icon: UserCog,         label: 'User Management'  },
      { to: '/pos-locations',        icon: MapPin,          label: 'POS Locations'    },
    ]
  },
]

export default function Sidebar({ isOpen, onClose }) {
  return (
    <aside className={`
      fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col
      bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
      transform transition-transform duration-300
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-200 dark:border-gray-700">
        <div className="w-10 h-10 bg-mango-500 rounded-xl flex items-center justify-center shadow-sm">
          <Leaf size={20} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">Hanu Reddy</p>
          <p className="text-xs text-mango-600 font-semibold">Mango Tourism</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-1">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.links.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-mango-50 text-mango-700 dark:bg-mango-900/30 dark:text-mango-400'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  <Icon size={17} />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs text-gray-400 text-center">© 2024 Hanu Reddy Mango Tourism</p>
      </div>
    </aside>
  )
}
