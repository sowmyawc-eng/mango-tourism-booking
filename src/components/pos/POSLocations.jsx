import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, QrCode, X, MapPin, ToggleLeft, ToggleRight } from 'lucide-react'
import QRCodeView from './QRCodeView'

export default function POSLocations() {
  const [locations, setLocations] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [qrTarget, setQrTarget]   = useState(null)   // show QR modal for this location

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  async function loadData() {
    const snap = await getDocs(collection(db, 'pos_locations'))
    setLocations(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }
  useEffect(() => { loadData() }, [])

  function openCreate() { setEditing(null); reset({}); setShowModal(true) }
  function openEdit(l)  { setEditing(l); reset(l);    setShowModal(true) }

  async function onSubmit(data) {
    try {
      if (editing) {
        await updateDoc(doc(db, 'pos_locations', editing.id), {
          pos_name:  data.pos_name,
          address:   data.address || null,
          updated_at: serverTimestamp(),
        })
        toast.success('Location updated')
      } else {
        await addDoc(collection(db, 'pos_locations'), {
          pos_name:     data.pos_name,
          address:      data.address || null,
          active_status: true,
          created_at:   serverTimestamp(),
        })
        toast.success('POS location added')
      }
      setShowModal(false)
      loadData()
    } catch (e) { toast.error(e.message) }
  }

  async function toggleActive(l) {
    await updateDoc(doc(db, 'pos_locations', l.id), { active_status: !l.active_status })
    toast.success(l.active_status ? 'Deactivated' : 'Activated')
    loadData()
  }

  async function handleDelete(l) {
    if (!confirm(`Delete "${l.pos_name}"?`)) return
    await deleteDoc(doc(db, 'pos_locations', l.id))
    toast.success('Deleted')
    loadData()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">POS Locations</h1>
        <button onClick={openCreate} className="btn-primary btn-sm flex items-center gap-1.5">
          <Plus size={15} /> Add Location
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-10">Loading…</p>
      ) : locations.length === 0 ? (
        <div className="card p-10 text-center">
          <MapPin size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No POS locations yet.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {locations.map(l => (
              <div key={l.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${l.active_status ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <MapPin size={18} className={l.active_status ? 'text-green-600' : 'text-gray-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">{l.pos_name}</p>
                  {l.address && <p className="text-xs text-gray-500 truncate">{l.address}</p>}
                  <p className={`text-xs font-medium mt-0.5 ${l.active_status ? 'text-green-600' : 'text-gray-400'}`}>
                    {l.active_status ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setQrTarget(l)}
                    className="p-2 text-gray-400 hover:text-mango-600 rounded-lg hover:bg-mango-50"
                    title="View QR Code"
                  >
                    <QrCode size={16} />
                  </button>
                  <button onClick={() => toggleActive(l)} className="p-2 text-gray-400 hover:text-blue-500 rounded-lg">
                    {l.active_status ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} />}
                  </button>
                  <button onClick={() => openEdit(l)} className="p-2 text-gray-400 hover:text-mango-600 rounded-lg">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(l)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4">
          <div className="card w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">{editing ? 'Edit Location' : 'Add POS Location'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="label">Location Name *</label>
                <input className="input-field" placeholder="Phoenix Mall – Level 2"
                  {...register('pos_name', { required: 'Required' })} />
                {errors.pos_name && <p className="text-red-500 text-xs mt-1">{errors.pos_name.message}</p>}
              </div>
              <div>
                <label className="label">Address / Notes</label>
                <input className="input-field" placeholder="Opposite food court"
                  {...register('address')} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="btn-primary flex-1">
                  {editing ? 'Save Changes' : 'Add Location'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrTarget && (
        <QRCodeView location={qrTarget} onClose={() => setQrTarget(null)} />
      )}
    </div>
  )
}
