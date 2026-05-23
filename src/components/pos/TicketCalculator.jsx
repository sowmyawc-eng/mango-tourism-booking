import { useEffect, useState } from 'react'
import {
  doc, getDoc, setDoc, getDocs,
  collection, query, where, serverTimestamp
} from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import { Save, Users, Baby, Tag, Calculator, RefreshCw, Plus, Minus } from 'lucide-react'
import toast from 'react-hot-toast'

const PROMO_META = {
  kid_free:    { icon: '🎁', label: 'Kids Free — 2 Adults = 1 Kid Free' },
  discount_15: { icon: '💰', label: '15% Discount on total'             },
}

export default function TicketCalculator() {
  const { role, currentUser } = useAuth()
  const isAdmin = role === 'super_admin'

  // Prices (from Firestore)
  const [prices,      setPrices]      = useState({ adult_price: 0, kid_price: 0 })
  const [editAdult,   setEditAdult]   = useState('')
  const [editKid,     setEditKid]     = useState('')
  const [savingPrices, setSavingPrices] = useState(false)
  const [pricesLoaded, setPricesLoaded] = useState(false)

  // Promo codes (active ones from Firestore)
  const [promoCodes, setPromoCodes] = useState([])

  // Calculator inputs
  const [adults,        setAdults]        = useState(1)
  const [kids,          setKids]          = useState(0)
  const [selectedPromo, setSelectedPromo] = useState('')

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const [priceSnap, promoSnap] = await Promise.all([
        getDoc(doc(db, 'settings', 'ticket_prices')),
        getDocs(query(collection(db, 'promo_codes'), where('active', '==', true))),
      ])

      if (priceSnap.exists()) {
        const d = priceSnap.data()
        setPrices({ adult_price: d.adult_price ?? 0, kid_price: d.kid_price ?? 0 })
        setEditAdult(String(d.adult_price ?? 0))
        setEditKid(String(d.kid_price ?? 0))
      }
      setPricesLoaded(true)

      setPromoCodes(promoSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    }
    load()
  }, [])

  // ── Save prices (admin only) ───────────────────────────────────────────────
  async function savePrices() {
    const ap = Number(editAdult)
    const kp = Number(editKid)
    if (isNaN(ap) || ap < 0 || isNaN(kp) || kp < 0) {
      toast.error('Enter valid prices')
      return
    }
    setSavingPrices(true)
    try {
      await setDoc(doc(db, 'settings', 'ticket_prices'), {
        adult_price: ap,
        kid_price:   kp,
        updated_at:  serverTimestamp(),
        updated_by:  currentUser.uid,
      })
      setPrices({ adult_price: ap, kid_price: kp })
      toast.success('Ticket prices saved!')
    } catch {
      toast.error('Could not save prices')
    } finally {
      setSavingPrices(false)
    }
  }

  // ── Calculation ────────────────────────────────────────────────────────────
  const adultCost = adults * prices.adult_price
  const kidCost   = kids   * prices.kid_price
  const subtotal  = adultCost + kidCost

  const promoData = promoCodes.find(p => p.id === selectedPromo) ?? null

  let discountAmt   = 0
  let discountLine  = ''
  let promoWarning  = ''

  if (promoData) {
    if (promoData.type === 'kid_free') {
      if (adults >= 2 && kids >= 1) {
        discountAmt  = prices.kid_price
        discountLine = `1 Kid Free`
      } else {
        promoWarning = adults < 2
          ? 'Kids Free offer needs at least 2 adults'
          : 'Kids Free offer needs at least 1 kid'
      }
    } else if (promoData.type === 'discount_15') {
      discountAmt  = Math.round(subtotal * 0.15)
      discountLine = `15% Off`
    }
  }

  const total = Math.max(0, subtotal - discountAmt)

  function reset() {
    setAdults(1)
    setKids(0)
    setSelectedPromo('')
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Calculator size={20} className="text-mango-500" /> Ticket Calculator
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Calculate the exact amount to collect from the customer</p>
        </div>
        <button onClick={reset}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-mango-600 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-mango-300 transition-colors">
          <RefreshCw size={13} /> Reset
        </button>
      </div>

      {/* ── Admin: Set Ticket Prices ──────────────────────────────────────── */}
      {isAdmin && (
        <div className="card p-4 space-y-3 border border-mango-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-mango-100 rounded-lg flex items-center justify-center">
              <span className="text-mango-600 text-sm">₹</span>
            </div>
            <h2 className="section-title">Set Ticket Prices</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Adult Ticket (₹) <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">₹</span>
                <input
                  className="input-field pl-7 text-lg font-bold"
                  type="number" inputMode="numeric" min="0"
                  placeholder="200"
                  value={editAdult}
                  onChange={e => setEditAdult(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Kid Ticket (₹) <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">₹</span>
                <input
                  className="input-field pl-7 text-lg font-bold"
                  type="number" inputMode="numeric" min="0"
                  placeholder="100"
                  value={editKid}
                  onChange={e => setEditKid(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            onClick={savePrices}
            disabled={savingPrices}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Save size={15} />
            {savingPrices ? 'Saving…' : 'Save Prices'}
          </button>
        </div>
      )}

      {/* ── Current Prices Display ───────────────────────────────────────── */}
      {pricesLoaded && (
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-3 text-center bg-mango-50 border border-mango-100">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Users size={14} className="text-mango-500" />
              <p className="text-xs font-semibold text-mango-600">Adult Ticket</p>
            </div>
            <p className="text-2xl font-bold text-mango-700">
              {prices.adult_price > 0 ? `₹${prices.adult_price}` : '—'}
            </p>
          </div>
          <div className="card p-3 text-center bg-blue-50 border border-blue-100">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Baby size={14} className="text-blue-500" />
              <p className="text-xs font-semibold text-blue-600">Kid Ticket</p>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {prices.kid_price > 0 ? `₹${prices.kid_price}` : '—'}
            </p>
          </div>
        </div>
      )}

      {prices.adult_price === 0 && pricesLoaded && !isAdmin && (
        <div className="card p-4 text-center bg-amber-50 border border-amber-200">
          <p className="text-sm text-amber-700 font-medium">
            ⚠️ Ticket prices haven't been set yet. Ask your admin to set prices first.
          </p>
        </div>
      )}

      {/* ── Calculator ───────────────────────────────────────────────────── */}
      <div className="card p-4 space-y-4">
        <h2 className="section-title">Calculate</h2>

        {/* Headcount — stepper buttons (mobile-friendly) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Adults */}
          <div>
            <label className="label flex items-center gap-1.5">
              <Users size={13} className="text-gray-400" /> Adults
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAdults(a => Math.max(1, a - 1))}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center flex-shrink-0 transition-colors"
              >
                <Minus size={16} className="text-gray-600" />
              </button>
              <span className="flex-1 text-center text-2xl font-bold text-gray-800 dark:text-white">
                {adults}
              </span>
              <button
                type="button"
                onClick={() => setAdults(a => a + 1)}
                className="w-10 h-10 rounded-xl bg-mango-100 hover:bg-mango-200 active:bg-mango-300 flex items-center justify-center flex-shrink-0 transition-colors"
              >
                <Plus size={16} className="text-mango-700" />
              </button>
            </div>
            <p className="text-xs text-center text-gray-400 mt-1">× ₹{prices.adult_price} = ₹{adultCost}</p>
          </div>

          {/* Kids */}
          <div>
            <label className="label flex items-center gap-1.5">
              <Baby size={13} className="text-gray-400" /> Kids (4–10)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setKids(k => Math.max(0, k - 1))}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center flex-shrink-0 transition-colors"
              >
                <Minus size={16} className="text-gray-600" />
              </button>
              <span className="flex-1 text-center text-2xl font-bold text-gray-800 dark:text-white">
                {kids}
              </span>
              <button
                type="button"
                onClick={() => setKids(k => k + 1)}
                className="w-10 h-10 rounded-xl bg-blue-100 hover:bg-blue-200 active:bg-blue-300 flex items-center justify-center flex-shrink-0 transition-colors"
              >
                <Plus size={16} className="text-blue-700" />
              </button>
            </div>
            <p className="text-xs text-center text-gray-400 mt-1">× ₹{prices.kid_price} = ₹{kidCost}</p>
          </div>
        </div>

        {/* Promo selection */}
        {promoCodes.length > 0 && (
          <div>
            <label className="label flex items-center gap-1.5">
              <Tag size={13} className="text-mango-500" /> Apply Offer
            </label>
            <select
              className="input-field"
              value={selectedPromo}
              onChange={e => setSelectedPromo(e.target.value)}
            >
              <option value="">No offer / Regular price</option>
              {promoCodes.map(p => (
                <option key={p.id} value={p.id}>
                  {PROMO_META[p.type]?.icon} {p.code} — {PROMO_META[p.type]?.label ?? p.type}
                </option>
              ))}
            </select>
            {promoWarning && (
              <p className="text-xs text-amber-600 mt-1 font-medium">⚠️ {promoWarning}</p>
            )}
          </div>
        )}

        {/* Bill breakdown */}
        <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-600">
          <div className="bg-gray-50 dark:bg-gray-700/40 px-4 py-3 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                {adults} Adult{adults !== 1 ? 's' : ''} × ₹{prices.adult_price}
              </span>
              <span className="font-medium text-gray-800 dark:text-white">₹{adultCost}</span>
            </div>

            {kids > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  {kids} Kid{kids !== 1 ? 's' : ''} × ₹{prices.kid_price}
                </span>
                <span className="font-medium text-gray-800 dark:text-white">₹{kidCost}</span>
              </div>
            )}

            <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-600 pt-2">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium text-gray-800 dark:text-white">₹{subtotal}</span>
            </div>

            {discountAmt > 0 && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                <span className="font-medium">
                  {promoData?.type === 'kid_free' ? '🎁' : '💰'} {discountLine}
                </span>
                <span className="font-semibold">− ₹{discountAmt}</span>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="bg-mango-500 px-4 py-4 flex items-center justify-between">
            <p className="text-white font-bold text-base">Total to Collect</p>
            <p className="text-white font-bold text-3xl">₹{total}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
