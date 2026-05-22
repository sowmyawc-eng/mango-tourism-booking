import { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { X, Download, Share2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function QRCodeView({ location, onClose }) {
  const canvasRef = useRef(null)

  const appUrl    = import.meta.env.VITE_APP_URL || window.location.origin
  const bookUrl   = `${appUrl}/book?pos=${location.id}`

  function downloadQR() {
    const canvas = document.getElementById(`qr-canvas-${location.id}`)
    if (!canvas) return
    const url  = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `QR_${location.pos_name.replace(/\s+/g,'_')}.png`
    link.href = url
    link.click()
    toast.success('QR code downloaded!')
  }

  async function shareQR() {
    if (navigator.share) {
      await navigator.share({ title: `QR – ${location.pos_name}`, url: bookUrl })
    } else {
      await navigator.clipboard.writeText(bookUrl)
      toast.success('Booking link copied!')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="card w-full max-w-xs p-5 text-center">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-left">
            <p className="font-bold text-gray-900 dark:text-white text-sm">{location.pos_name}</p>
            {location.address && <p className="text-xs text-gray-500">{location.address}</p>}
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* QR Code */}
        <div className="bg-white p-4 rounded-2xl inline-block mb-4 shadow-sm">
          <QRCodeCanvas
            id={`qr-canvas-${location.id}`}
            value={bookUrl}
            size={180}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
            includeMargin={false}
          />
        </div>

        <p className="text-xs text-gray-400 mb-4 break-all font-mono">{bookUrl}</p>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={downloadQR} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Download size={16} /> Download
          </button>
          <button onClick={shareQR} className="btn-secondary flex-1 flex items-center justify-center gap-2">
            <Share2 size={16} /> Share
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Print and place this QR at your stall. Customers scan to book directly.
        </p>
      </div>
    </div>
  )
}
