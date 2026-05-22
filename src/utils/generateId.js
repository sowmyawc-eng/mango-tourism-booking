/**
 * Generate a booking ID like: MNG-20240521-A3X7
 */
export function generateBookingId() {
  const date   = new Date()
  const ymd    = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`
  const chars  = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const suffix = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `MNG-${ymd}-${suffix}`
}

/**
 * Generate a ticket ID like: TKT-A1B2C3
 */
export function generateTicketId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const suffix = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `TKT-${suffix}`
}
