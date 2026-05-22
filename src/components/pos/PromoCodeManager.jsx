import { useEffect, useState } from 'react'
import {
  collection, query, where, getDocs,
  addDoc, updateDoc, doc, serverTimestamp
} from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { Tag, Copy, ToggleLeft, ToggleRight, RefreshCw, Check, Gift, Percent } from 'lucide-react'

// ── Generate a random promo code e.g. MANGO-K3X9 ─────────────────────────────
function makeCode(prefix) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 4; i++) suffix += chars[Math.floor(Math.random() * chars.length)]
  return `${prefix}-${suffix}`
}

const TYPE_META = {
  kid_free: {
    icon:    Gift,
    color:   'text-pink-600',
    bg:      'bg-pink-50 border-pink-200',
    badge:   'bg-pink-100 text-pink-700',
    title:   'Kid Free Promo',
    desc:    '2 Adults book → 1 Kid entry FREE',
    prefix:  'KIDFREE',
    note:    'Must be manually activated. Deactivate when not needed.',
    startActive: false,
  },
  discount_15: {
    icon:    Percent,
    color:   'text-blue-600',
    bg:      'bg-blue-50 border-blue-200',
    badge:   'bg-blue-100 text-blue-700',
    title:   '15% Discount Promo',
    desc:    '15% off the total booking amount',
    prefix:  'SAVE15',
    note:    'Active by default once generated.',
    startActive: true,
  },
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-mango-300 transition-colors"
    >
      {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} className="text-gray-400" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function PromoCard({ type, promo, onGenerate, onToggle, generating }) {
  const meta = TYPE_META[type]
  const Icon = meta.icon

  return (
    <div className={`card p-4 border ${meta.bg} space-y-3`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <Icon size={18} className={meta.color} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-800">{meta.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{meta.desc}</p>
        </div>
      </div>

      {promo ? (
        <>
          {/* Code display */}
          <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-gray-200">
            <Tag size={14} className="text-gray-400 flex-shrink-0" />
            <span className="font-mono font-bold text-gray-800 tracking-widest flex-1 text-sm">
              {promo.code}
            </span>
            <CopyButton text={promo.code} />
          </div>

          {/* Status + toggle */}
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${promo.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {promo.active ? '● Active' : '○ Inactive'}
            </span>
            <div className="flex items-center gap-2">
              {type === 'kid_free' && (
                <button
                  onClick={() => onToggle(promo)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-mango-300 font-medium text-gray-600 transition-colors"
                >
                  {promo.active
                    ? <><ToggleRight size={15} className="text-green-500" /> Deactivate</>
                    : <><ToggleLeft  size={15} className="text-gray-400"  /> Activate</>
                  }
                </button>
              )}
              <button
                onClick={() => onGenerate(type)}
                disabled={generating === type}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-mango-300 font-medium text-gray-600 transition-colors"
              >
                <RefreshCw size={13} className={generating === type ? 'animate-spin' : ''} />
                New Code
              </button>
            </div>
          </div>

          {/* Usage */}
          <p className="text-xs text-gray-400">Used {promo.use_count ?? 0} time{promo.use_count !== 1 ? 's' : ''}</p>
        </>
      ) : (
        <>
          <p className="text-xs text-gray-400 italic">{meta.note}</p>
          <button
            onClick={() => onGenerate(type)}
            disabled={generating === type}
            className="btn-primary btn-sm w-full flex items-center justify-center gap-2"
          >
            {generating === type
              ? <><RefreshCw size={14} className="animate-spin" /> Generating…</>
              : <><Tag size={14} /> Generate Code</>
            }
          </button>
        </>
      )}
    </div>
  )
}

export default function PromoCodeManager() {
  const { currentUser, userProfile } = useAuth()
  const [promos,     setPromos]     = useState({ kid_free: null, discount_15: null })
  const [loading,    setLoading]    = useState(true)
  const [generating, setGenerating] = useState(null)   // type currently being generated

  const posLocation = userProfile?.assigned_pos ?? null

  async function loadPromos() {
    setLoading(true)
    try {
      const q = posLocation
        ? query(collection(db, 'promo_codes'), where('pos_location', '==', posLocation))
        : query(collection(db, 'promo_codes'), where('created_by', '==', currentUser.uid))

      const snap = await getDocs(q)
      const result = { kid_free: null, discount_15: null }
      snap.docs.forEach(d => {
        const data = { id: d.id, ...d.data() }
        if (data.type === 'kid_free')    result.kid_free    = data
        if (data.type === 'discount_15') result.discount_15 = data
      })
      setPromos(result)
    } catch (e) {
      toast.error('Could not load promo codes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPromos() }, [currentUser, posLocation])

  async function handleGenerate(type) {
    setGenerating(type)
    try {
      const meta = TYPE_META[type]
      const code = makeCode(meta.prefix)

      // Deactivate the old code if one exists
      if (promos[type]) {
        await updateDoc(doc(db, 'promo_codes', promos[type].id), { active: false })
      }

      // Create new code
      await addDoc(collection(db, 'promo_codes'), {
        code,
        type,
        active:       meta.startActive,
        pos_location: posLocation,
        created_by:   currentUser.uid,
        created_at:   serverTimestamp(),
        use_count:    0,
      })

      toast.success(`New ${meta.title} code generated!`)
      loadPromos()
    } catch (e) {
      toast.error('Could not generate code. Try again.')
    } finally {
      setGenerating(null)
    }
  }

  async function handleToggle(promo) {
    try {
      await updateDoc(doc(db, 'promo_codes', promo.id), { active: !promo.active })
      toast.success(promo.active ? 'Promo deactivated' : 'Promo activated!')
      loadPromos()
    } catch (e) {
      toast.error('Could not update promo status')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Promo Codes</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Generate codes to share with customers. Only one code applies per booking.
        </p>
      </div>

      {/* Info banner */}
      <div className="card p-3 bg-amber-50 border border-amber-200">
        <p className="text-xs text-amber-700 font-medium">
          💡 Share your promo code with customers when they scan the QR code to book.
          The <strong>Kid Free</strong> code must be manually activated — turn it on before sharing.
        </p>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-10">Loading…</p>
      ) : (
        <div className="space-y-3">
          <PromoCard
            type="kid_free"
            promo={promos.kid_free}
            onGenerate={handleGenerate}
            onToggle={handleToggle}
            generating={generating}
          />
          <PromoCard
            type="discount_15"
            promo={promos.discount_15}
            onGenerate={handleGenerate}
            onToggle={handleToggle}
            generating={generating}
          />
        </div>
      )}

      <div className="card p-4 bg-gray-50 dark:bg-gray-700/30 space-y-2">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">How promo codes work</p>
        <ul className="text-xs text-gray-500 space-y-1.5">
          <li>🎁 <strong>Kid Free:</strong> Customer books 2+ adults, gets 1 kid entry free. Activate this code only when the offer is running.</li>
          <li>💰 <strong>15% Discount:</strong> Customer gets 15% off their total booking. Active once generated.</li>
          <li>📌 Only <strong>one promo code</strong> can be applied per booking.</li>
          <li>🔄 Generating a new code deactivates the old one automatically.</li>
        </ul>
      </div>
    </div>
  )
}
