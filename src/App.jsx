import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'

import Layout               from './components/layout/Layout'
import LoginPage            from './components/auth/LoginPage'
import PublicBookingForm    from './components/public/PublicBookingForm'
import QRDisplayPage        from './components/pos/QRDisplayPage'

import SuperAdminDashboard  from './components/dashboard/SuperAdminDashboard'
import POSManagerDashboard  from './components/dashboard/POSManagerDashboard'
import AccountantDashboard  from './components/dashboard/AccountantDashboard'

import LeadList             from './components/leads/LeadList'
import BookingList          from './components/bookings/BookingList'
import BookingForm          from './components/bookings/BookingForm'
import BookingDetail        from './components/bookings/BookingDetail'
import UserManagement       from './components/users/UserManagement'
import POSLocations         from './components/pos/POSLocations'
import PromoCodeManager     from './components/pos/PromoCodeManager'
import TicketCalculator     from './components/pos/TicketCalculator'

// ── Redirect to correct dashboard based on role ──────────────────────
function DashboardRedirect() {
  const { role } = useAuth()
  if (role === 'super_admin')  return <Navigate to="/admin/dashboard"      replace />
  if (role === 'pos_manager')  return <Navigate to="/pos/dashboard"        replace />
  if (role === 'accountant')   return <Navigate to="/accountant/dashboard" replace />
  return <Navigate to="/login" replace />
}

// ── Require login ────────────────────────────────────────────────────
function Protected({ children, roles }) {
  const { currentUser, role, loading } = useAuth()
  if (loading) return null
  if (!currentUser) return <Navigate to="/login" replace />
  if (roles && !roles.includes(role)) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  const { currentUser } = useAuth()
  return (
    <Routes>
      {/* Public — no login needed */}
      <Route path="/book"        element={<PublicBookingForm />} />
      <Route path="/qr-display"  element={<QRDisplayPage />} />
      <Route path="/login"       element={currentUser ? <DashboardRedirect /> : <LoginPage />} />
      <Route path="/"            element={currentUser ? <DashboardRedirect /> : <Navigate to="/login" replace />} />

      {/* Protected admin area */}
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/dashboard" element={<DashboardRedirect />} />

        {/* Super Admin only */}
        <Route path="/admin/dashboard" element={
          <Protected roles={['super_admin']}><SuperAdminDashboard /></Protected>
        }/>
        <Route path="/users" element={
          <Protected roles={['super_admin']}><UserManagement /></Protected>
        }/>
        <Route path="/pos-locations" element={
          <Protected roles={['super_admin','pos_manager']}><POSLocations /></Protected>
        }/>

        {/* POS Manager only */}
        <Route path="/pos/dashboard" element={
          <Protected roles={['pos_manager']}><POSManagerDashboard /></Protected>
        }/>

        {/* Accountant only */}
        <Route path="/accountant/dashboard" element={
          <Protected roles={['accountant']}><AccountantDashboard /></Protected>
        }/>

        {/* Promo Codes — admin only */}
        <Route path="/promo-codes" element={
          <Protected roles={['super_admin']}><PromoCodeManager /></Protected>
        }/>

        {/* Ticket Calculator — admin + POS */}
        <Route path="/calculator" element={
          <Protected roles={['super_admin','pos_manager']}><TicketCalculator /></Protected>
        }/>

        {/* Shared */}
        <Route path="/leads"       element={<Protected roles={['super_admin','pos_manager']}><LeadList /></Protected>}/>
        <Route path="/bookings"    element={<Protected roles={['super_admin','pos_manager','accountant']}><BookingList /></Protected>}/>
        {/* /bookings/new is disabled — all bookings come from the public /book form */}
        <Route path="/bookings/:id" element={<Protected roles={['super_admin','pos_manager','accountant']}><BookingDetail /></Protected>}/>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-center"
          toastOptions={{
            style:   { borderRadius: '12px', fontSize: '14px' },
            success: { style: { background: '#10b981', color: '#fff' } },
            error:   { style: { background: '#ef4444', color: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
