import jsPDF from 'jspdf'
import 'jspdf-autotable'
import QRCode from 'qrcode'

/**
 * Generate a PDF ticket and trigger download.
 * @param {Object} booking – Firestore booking document data
 */
export async function generateTicketPDF(booking) {
  const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' })
  const W = doc.internal.pageSize.getWidth()

  // ── Background header ─────────────────────────────────────────────
  doc.setFillColor(245, 158, 11)   // mango amber
  doc.rect(0, 0, W, 45, 'F')

  // ── Title ─────────────────────────────────────────────────────────
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('HANU REDDY MANGO TOURISM', W / 2, 16, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Festival Experience Ticket', W / 2, 23, { align: 'center' })

  // ── Ticket ID badge ───────────────────────────────────────────────
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(W / 2 - 28, 28, 56, 12, 3, 3, 'F')
  doc.setTextColor(180, 83, 9)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(booking.ticket_id || booking.booking_id, W / 2, 36, { align: 'center' })

  // ── Details table ─────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30)
  const rows = [
    ['Name',           `${booking.firstname} ${booking.lastname}`],
    ['Phone',          booking.phone],
    ['Email',          booking.email || '—'],
    ['Festival Date',  booking.festival_date || 'To be confirmed'],
    ['Adults',         String(booking.adults || 0)],
    ['Kids (4–10 yrs)',String(booking.kids   || 0)],
    ['Booking ID',     booking.booking_id],
    ['Booked On',      new Date(booking.created_at?.toDate?.() ?? booking.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })],
  ]

  doc.autoTable({
    startY:   50,
    margin:   { left: 10, right: 10 },
    head:     [['Field', 'Details']],
    body:     rows,
    styles:   { fontSize: 10, cellPadding: 3 },
    headStyles:  { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [255, 251, 235] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 42 } },
  })

  // ── QR Code ───────────────────────────────────────────────────────
  const qrText = `${import.meta.env.VITE_APP_URL || 'https://mangotourism.app'}/bookings/${booking.id}`
  try {
    const qrDataUrl = await QRCode.toDataURL(qrText, { width: 80, margin: 1 })
    const finalY = doc.lastAutoTable.finalY + 6
    const qrSize = 28
    doc.addImage(qrDataUrl, 'PNG', W / 2 - qrSize / 2, finalY, qrSize, qrSize)
    doc.setFontSize(7)
    doc.setTextColor(120)
    doc.text('Scan to verify ticket', W / 2, finalY + qrSize + 4, { align: 'center' })
  } catch { /* QR optional */ }

  // ── Footer ────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight()
  doc.setFillColor(245, 158, 11)
  doc.rect(0, pageH - 10, W, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7)
  doc.text('Thank you for booking with Hanu Reddy Mango Tourism!', W / 2, pageH - 4, { align: 'center' })

  // ── Save ──────────────────────────────────────────────────────────
  doc.save(`Ticket_${booking.booking_id}.pdf`)
}
