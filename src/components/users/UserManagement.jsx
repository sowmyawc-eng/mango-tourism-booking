import { useEffect, useState } from 'react'
import {
  collection, getDocs, updateDoc,
  deleteDoc, doc, serverTimestamp, setDoc, addDoc,
} from 'firebase/firestore'
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth'
import { db, secondaryAuth, DOMAIN } from '../../firebase'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Plus, Pencil, Trash2, X, Users, Eye, EyeOff, KeyRound } from 'lucide-react'

const ROLE_BADGE = {
  super_admin: 'bg-orange-100 text-orange-700',
  pos_manager: 'bg-blue-100 text-blue-700',
  accountant:  'bg-purple-100 text-purple-700',
}

const ROLE_LABEL = {
  super_admin: 'Super Admin',
  pos_manager: 'POS Manager',
  accountant:  'Accountant',
}

export default function UserManagement() {
  const { currentUser, userProfile } = useAuth()
  const [users,     setUsers]     = useState([])
  const [posLocs,   setPosLocs]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showModal,    setShowModal]    = useState(false)
  const [editing,      setEditing]      = useState(null)
  const [showPw,       setShowPw]       = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [resetTarget,  setResetTarget]  = useState(null)   // user being reset
  const [newPw,        setNewPw]        = useState('')
  const [showNewPw,    setShowNewPw]    = useState(false)
  const [resetting,    setResetting]    = useState(false)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm()
  const roleVal = watch('role')
  const R = { required: 'This field is required' }

  async function loadData() {
    const [uSnap, pSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'pos_locations')),
    ])
    setUsers(uSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    setPosLocs(pSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }
  useEffect(() => { loadData() }, [])

  function openCreate() { setEditing(null); reset({}); setShowPw(false); setShowModal(true) }
  function openEdit(u)  { setEditing(u);   reset(u);   setShowPw(false); setShowModal(true) }

  async function onSubmit(data) {
    setSaving(true)
    try {
      const email = `${data.username.trim().toLowerCase()}@${DOMAIN}`

      if (editing) {
        // Update Firestore profile only
        await updateDoc(doc(db, 'users', editing.id), {
          name:         data.name,
          role:         data.role,
          assigned_pos: data.assigned_pos || null,
          updated_at:   serverTimestamp(),
        })
        toast.success('User updated')
      } else {
        // Create Firebase Auth account via secondary app
        // (so current admin doesn't get signed out)
        const cred = await createUserWithEmailAndPassword(
          secondaryAuth,
          email,
          data.password
        )

        // Save profile in Firestore using UID as document ID
        await setDoc(doc(db, 'users', cred.user.uid), {
          name:              data.name,
          username:          data.username.trim().toLowerCase(),
          email,
          role:              data.role,
          assigned_pos:      data.assigned_pos || null,
          created_at:        serverTimestamp(),
          created_by:        currentUser?.uid ?? 'system',
          created_by_name:   userProfile?.name ?? 'Admin',
        })

        // Sign out from secondary app immediately
        await secondaryAuth.signOut()

        toast.success(`User "${data.username}" created`)
      }

      setShowModal(false)
      loadData()
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        toast.error('That username is already taken')
      } else {
        toast.error(e.message)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(u) {
    if (!confirm(`Delete user "${u.name}"? They will no longer be able to log in.`)) return
    await deleteDoc(doc(db, 'users', u.id))
    toast.success('User deleted')
    loadData()
  }

  async function handlePasswordReset() {
    if (!newPw || newPw.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setResetting(true)
    try {
      // Store reset in Firestore — applied automatically on user's next login
      await setDoc(doc(db, 'password_resets', resetTarget.id), {
        new_password:    newPw,
        reset_by:        currentUser?.uid,
        reset_by_name:   userProfile?.name ?? 'Admin',
        reset_at:        serverTimestamp(),
      })
      // Send in-app notification to the user
      await addDoc(collection(db, 'notifications'), {
        to_uid:     resetTarget.id,
        from_uid:   currentUser?.uid,
        from_name:  userProfile?.name ?? 'Admin',
        type:       'password_reset',
        title:      'Password reset by admin',
        body:       `Your password has been reset by ${userProfile?.name ?? 'Admin'}. It will update automatically on your next login.`,
        read:       false,
        created_at: serverTimestamp(),
      })
      toast.success(`Password reset set for ${resetTarget.name}. It applies on their next login.`)
      setResetTarget(null)
      setNewPw('')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Super admins can create unlimited POS Managers
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary btn-sm flex items-center gap-1.5">
          <Plus size={15} /> Add User
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2">
        {['super_admin','pos_manager','accountant'].map(r => (
          <div key={r} className="card p-3 text-center">
            <p className="text-xl font-bold text-gray-800 dark:text-white">
              {users.filter(u => u.role === r).length}
            </p>
            <p className="text-xs text-gray-500">{ROLE_LABEL[r]}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-10">Loading…</p>
      ) : users.length === 0 ? (
        <div className="card p-10 text-center">
          <Users size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No users yet.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {users.map(u => {
              const posName = u.assigned_pos
                ? posLocs.find(p => p.id === u.assigned_pos)?.pos_name
                : null
              return (
                <div key={u.id} className="flex items-start gap-3 px-4 py-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-mango-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-mango-700 font-bold text-sm">
                      {(u.name?.[0] ?? '?').toUpperCase()}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">{u.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">@{u.username ?? u.email?.split('@')[0]}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                      {u.email && (
                        <p className="text-xs text-gray-400">✉️ {u.email}</p>
                      )}
                      {posName && (
                        <p className="text-xs text-gray-400">📍 {posName}</p>
                      )}
                      {u.created_at?.toDate && (
                        <p className="text-xs text-gray-400">
                          Joined {format(u.created_at.toDate(), 'dd MMM yyyy')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(u)}
                      className="p-2 text-gray-400 hover:text-mango-600 rounded-lg hover:bg-mango-50"
                      title="Edit user">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => { setResetTarget(u); setNewPw(''); setShowNewPw(false) }}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                      title="Reset password">
                      <KeyRound size={15} />
                    </button>
                    <button onClick={() => handleDelete(u)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                      title="Delete user">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ──────────────────────────────────────────── */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4">
          <div className="card w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="section-title flex items-center gap-2">
                  <KeyRound size={15} className="text-blue-500" /> Reset Password
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">for <strong>{resetTarget.name}</strong></p>
              </div>
              <button onClick={() => setResetTarget(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 mb-4">
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                The new password will apply automatically on the user's <strong>next login</strong>.
                They will also receive an in-app notification. Share the new password with them via Messages.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    className="input-field pr-10"
                    placeholder="Min 6 characters"
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowNewPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <EyeOff size={15} />
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePasswordReset}
                  disabled={resetting}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <KeyRound size={14} />
                  {resetting ? 'Setting…' : 'Set New Password'}
                </button>
                <button onClick={() => setResetTarget(null)} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit User Modal ──────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4">
          <div className="card w-full max-w-md p-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">{editing ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="label">Full Name <span className="text-red-500">*</span></label>
                <input className="input-field" placeholder="Priya Lakshmi"
                  {...register('name', R)} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              {!editing && (
                <>
                  <div>
                    <label className="label">Username <span className="text-red-500">*</span></label>
                    <div className="flex items-center gap-2">
                      <input className="input-field" placeholder="priyalakshmi"
                        autoCapitalize="none" autoCorrect="off"
                        {...register('username', {
                          required: 'Required',
                          pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Letters, numbers and _ only' }
                        })} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">They will log in as: username@{DOMAIN}</p>
                    {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
                  </div>

                  <div>
                    <label className="label">Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        className="input-field pr-10"
                        placeholder="Min 6 characters"
                        {...register('password', {
                          required: 'Required',
                          minLength: { value: 6, message: 'Min 6 characters' }
                        })}
                      />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                  </div>
                </>
              )}

              <div>
                <label className="label">Role <span className="text-red-500">*</span></label>
                <select className="input-field" {...register('role', R)}>
                  <option value="">Select role…</option>
                  <option value="pos_manager">POS Manager</option>
                  <option value="accountant">Accountant</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
              </div>

              {roleVal === 'pos_manager' && (
                <div>
                  <label className="label">Assign POS Location</label>
                  <select className="input-field" {...register('assigned_pos')}>
                    <option value="">None / will select at stall</option>
                    {posLocs.map(p => (
                      <option key={p.id} value={p.id}>{p.pos_name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Creating…' : editing ? 'Save Changes' : 'Create User'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
