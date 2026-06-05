import { useEffect, useState } from 'react'
import { MoreVertical, Edit2, Trash2, MapPin, Users } from 'lucide-react'
import { toast } from 'react-toastify'
import { stadiumService } from '../../services/stadiumService'
import { unwrapData } from '../../utils/apiData'
import '../../common/AdminStyles.css'
import FormModal from '../../components/ui/FormModal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import FileUploadField from '../../components/ui/FileUploadField'
import KebabMenu from '../../components/ui/KebabMenu'
import CityAutocomplete from '../../components/ui/CityAutocomplete'
import { VIETNAM_PROVINCES } from '../../constants/cities'

export default function StadiumManagePage() {
  const [stadiums, setStadiums] = useState([])
  const [form, setForm] = useState({ name: '', city: '', address: '', imageUrl: '', capacity: '' })
  const [initialForm, setInitialForm] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ show: false, type: null, target: null })
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)

  useEffect(() => {
    fetchStadiums()
  }, [])

  const fetchStadiums = async () => {
    try {
      const res = await stadiumService.getAll()
      const payload = unwrapData(res)
      setStadiums(payload?.data ?? payload ?? [])
    } catch {
      setStadiums([])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const errors = []
    if (!form.name.trim()) errors.push('Name')
    if (!form.city.trim()) errors.push('City')
    if (!form.address.trim()) errors.push('Address')
    if (!form.capacity || Number(form.capacity) <= 0) errors.push('Capacity')
    if (!form.imageUrl) errors.push('Image')

    if (errors.length > 0) {
      toast.error(`Please enter: ${errors.join(', ')}`)
      return
    }

    if (editingId) {
      setConfirmModal({ show: true, type: 'update', target: null })
    } else {
      executeSubmit()
    }
  }

  const executeSubmit = async () => {
    try {
      const payload = {
        name: form.name.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        imageUrl: form.imageUrl || undefined,
        capacity: Number(form.capacity) || 0
      }
      
      if (editingId) {
        await stadiumService.update(editingId, payload)
        toast.success('Stadium updated successfully.')
      } else {
        await stadiumService.create(payload)
        toast.success('Stadium created successfully.')
      }
      clearForm()
      fetchStadiums()
      setConfirmModal({ show: false, type: null, target: null })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed.')
    }
  }

  const editStadium = (stadium) => {
    const data = {
      name: stadium.name,
      city: stadium.city || '',
      address: stadium.address || '',
      imageUrl: stadium.image_url || '',
      capacity: stadium.capacity || ''
    }
    setEditingId(stadium.id)
    setForm(data)
    setInitialForm(data)
    setIsFormModalOpen(true)
  }

  const clearForm = () => {
    setEditingId(null)
    setInitialForm(null)
    setForm({ name: '', city: '', address: '', imageUrl: '', capacity: '' })
    setIsFormModalOpen(false)
  }

  const hasChanges = () => {
    if (!editingId || !initialForm) return true
    return (
      form.name !== initialForm.name ||
      form.city !== initialForm.city ||
      form.address !== initialForm.address ||
      form.imageUrl !== initialForm.imageUrl ||
      form.capacity !== initialForm.capacity
    )
  }

  const deleteStadium = (id) => {
    setConfirmModal({ show: true, type: 'delete', target: id })
  }

  const executeDelete = async (id) => {
    try {
      await stadiumService.remove(id)
      fetchStadiums()
      toast.success('Stadium removed.')
      setConfirmModal({ show: false, type: null, target: null })
    } catch {
      toast.error('Cannot delete stadium.')
    }
  }

  const filteredStadiums = stadiums.filter((s) => {
    const searchLower = searchTerm.toLowerCase()
    return s.name?.toLowerCase().includes(searchLower) || s.city?.toLowerCase().includes(searchLower)
  })

  return (
    <section className="container page" style={{ border: 'none', background: 'transparent', paddingBottom: '60px' }}>
      {/* Header */}
      <div className="section-head" style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="admin-header">Stadiums</h1>
          <p className="section-subtitle" style={{ fontSize: '1rem', color: 'var(--color-slate-500)', marginTop: '8px' }}>
            Manage venues where matches will take place.
          </p>
        </div>
        <button 
          onClick={() => { clearForm(); setIsFormModalOpen(true); }}
          style={{ padding: '14px 28px', borderRadius: '12px', background: 'var(--color-slate-900)', color: 'var(--color-white)', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
        >
          + Add New Stadium
        </button>
      </div>

      {/* Form Modal */}
      <FormModal
        isOpen={isFormModalOpen}
        onClose={clearForm}
        onSubmit={handleSubmit}
        title={editingId ? 'Edit Stadium' : 'Create New Stadium'}
        submitLabel={editingId ? 'Save Changes' : 'Create Stadium'}
        submitDisabled={!hasChanges()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="admin-label">Stadium Name *</label>
          <input
            placeholder="e.g. My Dinh National Stadium"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="admin-input"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="admin-label">Capacity *</label>
          <input
            type="text"
            placeholder="e.g. 40.000"
            value={form.capacity ? Number(form.capacity).toLocaleString('vi-VN') : ''}
            onChange={(e) => {
              const rawValue = e.target.value.replace(/\D/g, '');
              setForm((p) => ({ ...p, capacity: rawValue }));
            }}
            className="admin-input"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="admin-label">City *</label>
            <CityAutocomplete
              placeholder="e.g. Ha Noi"
              value={form.city}
              onChange={(value) => setForm((p) => ({ ...p, city: value }))}
              cities={VIETNAM_PROVINCES}
              inputClassName="admin-input"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="admin-label">Address *</label>
            <input
              placeholder="e.g. Le Duc Tho, My Dinh, Nam Tu Liem"
              value={form.address}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              className="admin-input"
            />
          </div>
        </div>

        <FileUploadField
          label="Stadium Image *"
          value={form.imageUrl}
          onChange={(url) => setForm((p) => ({ ...p, imageUrl: url }))}
          previewType="banner"
          placeholder="Click or drag & drop stadium image"
        />
      </FormModal>

      {/* Search */}
      <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="text"
            placeholder="Search stadiums by name or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--color-slate-300)', outline: 'none', fontSize: '0.9rem', width: '320px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
          />
          <span style={{ color: 'var(--color-slate-400)', fontSize: '0.85rem' }}>
            {filteredStadiums.length} stadium{filteredStadiums.length !== 1 ? 's' : ''} found
          </span>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {filteredStadiums.map((stadium) => (
          <article className="card" key={stadium.id} style={{ padding: '0', overflow: 'visible', border: '1px solid var(--color-slate-200)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: '20px', background: 'var(--color-white)' }}>
            {/* Card Header Banner */}
            <div 
              style={{ 
                height: '140px', 
                background: stadium.image_url ? `url(${stadium.image_url}) center/cover` : 'var(--color-slate-100)', 
                borderRadius: '20px 20px 0 0',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-end',
                padding: '12px'
              }}
            >
              {!stadium.image_url && (
                <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-slate-400)' }}>
                  No Image
                </div>
              )}
              {/* Kebab Menu positioned over banner */}
              <KebabMenu 
                variant="glass" 
                onEdit={() => editStadium(stadium)} 
                onDelete={() => deleteStadium(stadium.id)} 
              />
            </div>
            
            {/* Card Body */}
            <div style={{ padding: '20px 24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-slate-900)', lineHeight: 1.2 }}>{stadium.name}</h3>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginTop: '12px', color: 'var(--color-slate-500)', fontSize: '0.9rem' }}>
                <MapPin size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{stadium.address ? `${stadium.address}, ${stadium.city}` : stadium.city}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: 'var(--color-slate-500)', fontSize: '0.9rem' }}>
                <Users size={16} style={{ flexShrink: 0 }} />
                <span>Capacity: {stadium.capacity ? stadium.capacity.toLocaleString('vi-VN') : 0} seats</span>
              </div>
            </div>
          </article>
        ))}

        {filteredStadiums.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--color-slate-400)', background: 'var(--color-white)', borderRadius: '20px', border: '1px solid var(--color-slate-200)' }}>
            No stadiums found.
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.show}
        onClose={() => setConfirmModal({ show: false, type: null, target: null })}
        onConfirm={() => confirmModal.type === 'delete' ? executeDelete(confirmModal.target) : executeSubmit()}
        title={confirmModal.type === 'delete' ? 'Delete Stadium?' : 'Update Stadium?'}
        message={confirmModal.type === 'delete'
          ? 'This action is permanent and will remove this stadium from the system.'
          : 'Are you sure you want to save these changes?'}
        confirmLabel="Confirm"
        variant={confirmModal.type === 'delete' ? 'danger' : 'default'}
      />
    </section>
  )
}
