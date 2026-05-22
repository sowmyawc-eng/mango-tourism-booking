import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import Layout               from './components/layout/Layout'
import PublicBookingForm    from './components/public/PublicBookingForm'
import SuperAdminDashboard  from './components/dashboard/SuperAdminDashboard'
import POSManagerDashboard  from './components/dashboard/POSManagerDashboard'
import AccountantDashboard  from './components/dashboard/AccountantDashboard'
import LeadList             from './components/leads/LeadList'
import BookingList          from './components/bookings/BookingList'
import BookingForm          from './components/bookings/BookingForm'
import BookingDetail        from './components/bookings/BookingDetail'
import UserManagement       from './components/users/UserManagement'
import POSLocations         from './components/pos/POSLocations'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public booking form — no nav, no layout */}
        <Route path="/book" element={<PublicBookingForm />} />

        {/* All admin pages share the Layout */}
        <Route element={<Layout />}>
          <Route path="/"                        element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"               element={<SuperAdminDashboard />} />
          <Route path="/pos/dashboard"           element={<POSManagerDashboard />} />
          <Route path="/accountant/dashboard"    element={<AccountantDashboard />} />
          <Route path="/leads"                   element={<LeadList />} />
          <Route path="/bookings"                element={<BookingList />} />
          <Route path="/bookings/new"            element={<BookingForm />} />
          <Route path="/bookings/:id"            element={<BookingDetail />} />
          <Route path="/users"                   element={<UserManagement />} />
          <Route path="/pos-locations"           element={<POSLocations />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster
        position="top-center"
        toastOptions={{
          style:   { borderRadius: '12px', fontSize: '14px' },
          success: { style: { background: '#10b981', color: '#fff' } },
          error:   { style: { background: '#ef4444', color: '#fff' } },
        }}
      />
    </BrowserRouter>
  )
}
