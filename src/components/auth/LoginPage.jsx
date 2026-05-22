import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  async function onSubmit({ username, password }) {
    setLoading(true)
    try {
      await login(username.trim(), password)
      navigate('/dashboard')
    } catch (err) {
      toast.error('Invalid username or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center
                    bg-gradient-to-br from-mango-50 to-orange-100
                    dark:from-gray-900 dark:to-gray-800 px-4 py-8">

      {/* Banner — natural aspect ratio, no cropping */}
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-xl mb-2">
        <img
          src="/banner.avif"
          alt="Hanu Reddy Mango Tourism – June 2026"
          className="w-full h-auto block"
        />
      </div>

      {/* App subtitle */}
      <p className="text-xs font-semibold text-mango-700 dark:text-mango-400 tracking-wide uppercase mb-5">
        Smart Booking &amp; POS Management
      </p>

      {/* Login card */}
      <div className="card w-full max-w-sm p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Staff Login</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Sign in with your username and password
        </p>

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

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>

      <p className="mt-6 text-xs text-gray-400">© 2026 Hanu Reddy Mango Tourism · hrmt.store</p>
    </div>
  )
}
