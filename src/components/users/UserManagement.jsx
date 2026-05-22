import { useEffect, useState } from 'react'
import {
  collection, getDocs, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp, setDoc
} from 'firebase/firestore'
import { db } from '../../firebase'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, X, Users } from 'lucide-react'

export default function UserManagement() {
  const [users, setUsers]     = useState([])
  const [posLocs, setPosLocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

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

  function openCreate() { setEditing(null); reset({}); setShowModal(true) }
  function openEdit(u)  { setEditing(u); reset(u);    setShowModal(true) }

  async function onSubmit(data) {
    try {
      const payload = {
        name:         data.name,
        email:        data.email,
        role:         data.role,
        assigned_pos: data.assigned_pos || null,
        phone:        data.phone || null,
      }
      if (editing) {
        await updateDoc(doc(db, 'users', editing.id), { ...payload, updated_at: serverTimestamp() })
        toast.success('User updated')
      } else {
        await addDoc(collection(db, 'users'), { ...payload, created_at: serverTimestamp() })
        toast.success('User added')
      }
      setShowModal(false)
      loadData()
    } catch (e) {
      toast.error(e.message)
    }
  }

  async function handleDelete(u) {
    if (!confirm(`Delete ${u.name}?`)) return
    await deleteDoc(doc(db, 'users', u.id))
    toast.success('User deleted')
    loadData()
  }

  const ROLE_BADGE = {
    super_admin: 'bg-orange-100 text-orange-700',
    pos_manager: 'bg-blue-100 text-blue-700',
    accountant:  'bg-purple-100 text-purple-700',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">User Management</h1>
        <button onClick={openCreate} className="btn-primary btn-sm flex items-center gap-1.5">
          <Plus size={15} /> Add User
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-10">Loading…</p>
      ) : users.length === 0 ? (
        <div className="card p-10 text-center">
          <Users size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No users yet. Add your first team member.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-mango-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-mango-700 font-bold text-sm">
                    {(u.name?.[0] ?? '?').toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{u.name}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium hidden sm:inline-block ${ROLE_BADGE[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                  {u.role?.replace('_', ' ')}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(u)}
                    className="p-2 text-gray-400 hover:text-mango-600 rounded-lg hover:bg-mango-50">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(u)}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4">
          <div className="card w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">{editing ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="label">Full Name <span className="text-red-500">*</span></label>
                <input className="input-field" placeholder="John Doe" {...register('name', R)} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label">Email <span className="text-red-500">*</span></label>
                <input className="input-field" type="email" placeholder="user@example.com"
                  {...register('email', {
                    required: 'Required',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter valid email' }
                  })} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="label">Phone <span className="text-red-500">*</span></label>
                <input className="input-field" type="tel" placeholder="9876543210"
                  {...register('phone', {
                    required: 'Required',
                    pattern: { value: /^[0-9]{10}$/, message: '10-digit number' }
                  })} />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
              </div>
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
                  <label className="label">Assign POS Location <span className="text-red-500">*</span></label>
                  <select className="input-field" {...register('assigned_pos', R)}>
                    <option value="">Select location…</option>
                    {posLocs.map(p => (
                      <option key={p.id} value={p.id}>{p.pos_name}</option>
                    ))}
                  </select>
                  {errors.assigned_pos && <p className="text-red-500 text-xs mt-1">{errors.assigned_pos.message}</p>}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1">
                  {editing ? 'Save Changes' : 'Add User'}
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
