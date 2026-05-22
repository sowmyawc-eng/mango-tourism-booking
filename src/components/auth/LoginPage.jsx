import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const floaters = [
  { emoji: '🥭', size: 32, x: 8,  y: 10, delay: 0,   dur: 6  },
  { emoji: '🌿', size: 24, x: 85, y: 15, delay: 1,   dur: 7  },
  { emoji: '🥭', size: 20, x: 20, y: 70, delay: 2,   dur: 8  },
  { emoji: '🌸', size: 22, x: 75, y: 60, delay: 0.5, dur: 6.5},
  { emoji: '🥭', size: 28, x: 50, y: 85, delay: 3,   dur: 7.5},
  { emoji: '🍃', size: 18, x: 92, y: 40, delay: 1.5, dur: 9  },
  { emoji: '🥭', size: 16, x: 5,  y: 50, delay: 2.5, dur: 5.5},
  { emoji: '⭐', size: 14, x: 60, y: 12, delay: 0.8, dur: 8  },
  { emoji: '🌿', size: 20, x: 38, y: 92, delay: 1.8, dur: 7  },
  { emoji: '🥭', size: 22, x: 70, y: 80, delay: 3.5, dur: 6  },
]

export default function LoginPage() {
  const { login }   = useAuth()
  const navigate    = useNavigate()
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  async function onSubmit({ username, password }) {
    setLoading(true)
    try {
      await login(username.trim(), password)
      navigate('/dashboard')
    } catch {
      toast.error('Invalid username or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ── Keyframe animations ─────────────────────────────────────────────── */}
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0px) rotate(0deg);   opacity: 0.7; }
          50%  { transform: translateY(-22px) rotate(8deg); opacity: 1;   }
          100% { transform: translateY(0px) rotate(0deg);   opacity: 0.7; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes popIn {
          0%   { opacity: 0; transform: scale(0.85); }
          70%  { transform: scale(1.03);              }
          100% { opacity: 1; transform: scale(1);     }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.9; }
        }
        .float-item   { animation: floatUp var(--dur) ease-in-out var(--delay) infinite; }
        .fade-up      { animation: fadeSlideUp 0.65s cubic-bezier(.22,.68,0,1.2) both; }
        .pop-in       { animation: popIn 0.55s cubic-bezier(.22,.68,0,1.2) both; }
        .shimmer-text { animation: shimmer 3s ease-in-out infinite; }
      `}</style>

      {/* ── Full-screen background ───────────────────────────────────────────── */}
      <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-4 py-10"
           style={{ background: 'linear-gradient(145deg, #b2ebe4 0%, #f0faf8 40%, #fff7e6 70%, #ffe0a0 100%)' }}>

        {/* Floating emoji layer */}
        {floaters.map((f, i) => (
          <span
            key={i}
            className="float-item pointer-events-none select-none absolute"
            style={{
              '--dur':   `${f.dur}s`,
              '--delay': `${f.delay}s`,
              left:  `${f.x}%`,
              top:   `${f.y}%`,
              fontSize: `${f.size}px`,
              opacity: 0.55,
              zIndex: 0,
            }}
          >
            {f.emoji}
          </span>
        ))}

        {/* ── Content ─────────────────────────────────────────────────────────── */}
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center">

          {/* Banner */}
          <div className="pop-in w-full rounded-3xl overflow-hidden shadow-2xl mb-1"
               style={{ animationDelay: '0.05s' }}>
            <img
              src="/banner.avif"
              alt="Hanu Reddy Mango Tourism – June 2026"
              className="w-full h-auto block"
            />
          </div>

          {/* Subtitle badge */}
          <div className="fade-up mb-5 mt-2 px-4 py-1.5 rounded-full shadow-md"
               style={{
                 animationDelay: '0.2s',
                 background: 'linear-gradient(90deg, #f59e0b, #ef8c00)',
               }}>
            <p className="text-white text-xs font-bold tracking-widest uppercase">
              Smart Booking &amp; POS Management
            </p>
          </div>

          {/* Login card */}
          <div className="fade-up w-full rounded-3xl shadow-2xl overflow-hidden"
               style={{
                 animationDelay: '0.3s',
                 background: 'rgba(255,255,255,0.88)',
                 backdropFilter: 'blur(20px)',
                 border: '1px solid rgba(255,255,255,0.6)',
               }}>

            {/* Card top accent */}
            <div className="h-1.5 w-full"
                 style={{ background: 'linear-gradient(90deg, #7dd3c8, #f59e0b, #7dd3c8)' }} />

            <div className="p-6">
              {/* Greeting */}
              <div className="mb-5 text-center">
                <p className="text-2xl font-bold text-gray-800 leading-tight">
                  Welcome Back 👋
                </p>
                <p className="text-xs text-gray-400 mt-1 font-medium tracking-wide">
                  Sign in to your staff account
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {/* Username */}
                <div>
                  <label className="label">Username</label>
                  <input
                    className="input-field"
                    placeholder="e.g. rajeshkumar"
                    autoCapitalize="none"
                    autoCorrect="off"
                    {...register('username', { required: 'Username is required' })}
                  />
                  {errors.username && (
                    <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      className="input-field pr-10"
                      placeholder="••••••••"
                      {...register('password', { required: 'Password is required' })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-white text-sm tracking-wide transition-all duration-200 active:scale-95 disabled:opacity-60 mt-2"
                  style={{ background: loading ? '#d4a43a' : 'linear-gradient(90deg, #f59e0b, #ef8c00)' ,
                           boxShadow: '0 4px 14px rgba(245,158,11,0.45)' }}
                >
                  {loading ? 'Signing in…' : '🥭 Sign In'}
                </button>
              </form>
            </div>
          </div>

          <p className="fade-up mt-5 text-xs text-gray-400 text-center"
             style={{ animationDelay: '0.45s' }}>
            © 2026 Hanu Reddy Mango Tourism · hrmt.store
          </p>
        </div>
      </div>
    </>
  )
}
