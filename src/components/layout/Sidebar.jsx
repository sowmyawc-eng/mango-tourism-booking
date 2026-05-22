import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, MapPin, ClipboardList,
  BookOpen, Leaf, LogOut, X, CheckSquare, QrCode, UserCog, Tag, Calculator
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const NAV = {
  super_admin: [
    { to: '/admin/dashboard',  icon: LayoutDashboard, label: 'Dashboard'            },
    { to: '/bookings',         icon: BookOpen,        label: 'All Bookings'         },
    { to: '/leads',            icon: ClipboardList,   label: 'Leads'                },
    { to: '/pos-locations',    icon: MapPin,          label: 'POS Locations'        },
    { to: '/promo-codes',      icon: Tag,             label: 'Promo Codes'          },
    { to: '/calculator',       icon: Calculator,      label: 'Ticket Calculator'    },
    { to: '/users',            icon: UserCog,         label: 'User Management'      },
    { to: '/qr-display',       icon: QrCode,          label: 'Show QR to Customer', external: true },
  ],
  pos_manager: [
    { to: '/pos/dashboard',    icon: LayoutDashboard, label: 'Dashboard'            },
    { to: '/bookings',         icon: ClipboardList,   label: 'Bookings'             },
    { to: '/leads',            icon: Users,           label: 'Leads'                },
    { to: '/pos-locations',    icon: MapPin,          label: 'Locations'            },
    { to: '/calculator',       icon: Calculator,      label: 'Ticket Calculator'    },
    { to: '/qr-display',       icon: QrCode,          label: 'Show QR to Customer', external: true },
  ],
  accountant: [
    { to: '/accountant/dashboard', icon: CheckSquare, label: 'Verify Payments' },
    { to: '/bookings',             icon: BookOpen,    label: 'All Bookings'    },
  ],
}

const ROLE_LABEL = {
  super_admin: 'Super Admin',
  pos_manager: 'POS Manager',
  accountant:  'Accountant',
}

export default function Sidebar({ isOpen, onClose }) {
  const { role, userProfile, logout } = useAuth()
  const links = NAV[role] ?? []

  async function handleLogout() {
    await logout()
    toast.success('Signed out')
  }

  return (
    <aside className={`
      fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col
      bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
      transform transition-transform duration-300
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Brand */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-mango-500 rounded-xl flex items-center justify-center shadow-sm">
            <Leaf size={20} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">Hanu Reddy</p>
            <p className="text-xs text-mango-600 font-semibold">Mango Tourism</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600 p-1">
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ to, icon: Icon, label, external }) =>
          external ? (
            <a
              key={to}
              href={to}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                         text-mango-600 hover:bg-mango-50 dark:hover:bg-mango-900/20 transition-all"
            >
              <Icon size={17} />
              {label}
            </a>
          ) : (
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
          )
        )}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-mango-100 flex items-center justify-center flex-shrink-0">
            <span className="text-mango-700 font-bold text-sm">
              {(userProfile?.name?.[0] ?? '?').toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
              {userProfile?.name ?? '—'}
            </p>
            <p className="text-xs text-mango-600 font-medium">
              {ROLE_LABEL[role] ?? role}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500
                     hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  )
}
