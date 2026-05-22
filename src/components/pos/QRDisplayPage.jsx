import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import { QRCodeCanvas } from 'qrcode.react'
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin

export default function QRDisplayPage() {
  const [locations, setLocations] = useState([])
  const [selected,  setSelected]  = useState(0)
  const [loading,   setLoading]   = useState(true)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    getDocs(collection(db, 'pos_locations')).then(snap => {
      const locs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(l => l.active_status !== false)
      setLocations(locs)
      setLoading(false)
    })
  }, [])

  function prev() { setSelected(i => (i - 1 + locations.length) % locations.length) }
  function next() { setSelected(i => (i + 1) % locations.length) }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()
      setFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setFullscreen(false)
    }
  }

  const loc     = locations[selected]
  const bookUrl = loc ? `${APP_URL}/book?pos=${loc.id}` : ''

  if (loading) {
    return (
      <div className="min-h-screen bg-mango-500 flex items-center justify-center">
        <p className="text-white text-lg font-semibold">Loading…</p>
      </div>
    )
  }

  if (locations.length === 0) {
    return (
      <div className="min-h-screen bg-mango-500 flex flex-col items-center justify-center px-6 text-center">
        <Leaf size={48} className="text-white mb-4" />
        <p className="text-white text-xl font-bold mb-2">No POS Locations Found</p>
        <p className="text-mango-100 text-sm">Please add POS locations first from the admin panel.</p>
        <a href="/pos-locations" className="mt-6 bg-white text-mango-600 font-bold px-6 py-3 rounded-xl">
          Add Locations
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mango-400 to-orange-500 flex flex-col">

      {/* Banner */}
      <div className="relative bg-[#c8e8e4]">
        <img
          src="/banner.avif"
          alt="Hanu Reddy Mango Tourism – June 2026"
          className="w-full block"
          style={{ maxHeight: '80px', objectFit: 'contain' }}
        />
        <button
          onClick={toggleFullscreen}
          className="absolute top-2 right-2 p-2 bg-black/30 hover:bg-black/50 rounded-xl text-white transition-colors"
          title="Toggle fullscreen"
        >
          <Maximize2 size={18} />
        </button>
      </div>

      {/* Main QR card */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">

          {/* Scan instruction */}
          <p className="text-mango-600 font-bold text-lg mb-1">📱 Scan to Book</p>
          <p className="text-gray-500 text-sm mb-6">
            Use your phone camera to scan and book your festival experience
          </p>

          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-white border-4 border-mango-100 rounded-2xl shadow-inner inline-block">
              <QRCodeCanvas
                value={bookUrl}
                size={220}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
                includeMargin={false}
              />
            </div>
          </div>

          <p className="text-sm font-semibold text-mango-600">
            🥭 Hanu Reddy Mango Festival 2026
          </p>
        </div>

        {/* Navigation arrows — only if multiple locations */}
        {locations.length > 1 && (
          <div className="flex items-center gap-6 mt-8">
            <button
              onClick={prev}
              className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {locations.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === selected ? 'bg-white scale-125' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        )}
      </div>

      {/* Bottom hint for staff */}
      <div className="text-center pb-6">
        <p className="text-white/60 text-xs">
          Show this screen to the customer · tap arrows to switch location
        </p>
      </div>
    </div>
  )
}
