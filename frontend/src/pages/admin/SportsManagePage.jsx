import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { sportService } from '../../services/sportService'
import { uploadService } from '../../services/uploadService'
import { unwrapData } from '../../utils/apiData'

export default function SportsManagePage() {
  const [sports, setSports] = useState([])
  const [form, setForm] = useState({ name: '', slug: '', bannerUrl: '' })
  const [initialForm, setInitialForm] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ show: false, type: null, target: null })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const response = await sportService.getAll()
        setSports(unwrapData(response) || [])
      } catch {
        setSports([])
      }
    }

    fetchSports()
  }, [])

  const refresh = async () => {
    try {
      const response = await sportService.getAll()
      setSports(unwrapData(response) || [])
    } catch {
      setSports([])
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (editingId) {
      setConfirmModal({ show: true, type: 'update', target: null })
    } else {
      executeSubmit()
    }
  }

  const executeSubmit = async () => {
    try {
      if (editingId) {
        await sportService.update(editingId, form)
        toast.success('Sport updated successfully.')
      } else {
        await sportService.create(form)
        toast.success('Sport created successfully.')
      }
      clearForm()
      refresh()
      setConfirmModal({ show: false, type: null, target: null })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed.')
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      const response = await uploadService.uploadFile(file)
      const { url } = unwrapData(response)
      setForm((p) => ({ ...p, bannerUrl: url }))
      toast.success('Banner uploaded.')
    } catch (error) {
      toast.error('Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const editSport = (sport) => {
    const sportData = { 
      name: sport.name, 
      slug: sport.slug, 
      bannerUrl: sport.banner_url || '' 
    }
    setEditingId(sport.id)
    setForm(sportData)
    setInitialForm(sportData)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearForm = () => {
    setEditingId(null)
    setInitialForm(null)
    setForm({ name: '', slug: '', bannerUrl: '' })
  }

  const hasChanges = () => {
    if (!editingId || !initialForm) return true
    return form.name !== initialForm.name || 
           form.slug !== initialForm.slug || 
           form.bannerUrl !== initialForm.bannerUrl
  }

  const deleteSport = async (id) => {
    setConfirmModal({ show: true, type: 'delete', target: id })
  }

  const executeDelete = async (id) => {
    try {
      await sportService.remove(id)
      refresh()
      toast.success('Sport removed.')
      setConfirmModal({ show: false, type: null, target: null })
    } catch (error) {
      toast.error('Cannot delete sport.')
    }
  }

  return (
    <section className="container page" style={{ border: 'none', background: 'transparent', paddingBottom: '60px' }}>
      <div className="section-head" style={{ marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '3rem', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '-2px', color: '#111827', lineHeight: 1, margin: 0 }}>Sports</h1>
          <p className="section-subtitle" style={{ fontSize: '1rem', color: '#6b7280', marginTop: '8px' }}>
            Manage sports categories and their visual representations.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '32px', borderRadius: '24px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', background: '#fff', marginBottom: '48px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '24px', color: '#111827' }}>
          {editingId ? 'Edit Sport Category' : 'Create New Category'}
        </h2>
        <form className="form" onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Sport Name</label>
            <input 
              placeholder="e.g. Football" 
              value={form.name} 
              onChange={(e) => {
                const name = e.target.value;
                const slug = name.toLowerCase()
                  .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove Vietnamese tones
                  .replace(/[đĐ]/g, 'd')
                  .replace(/([^0-9a-z-\s])/g, '')
                  .replace(/(\s+)/g, '-')
                  .replace(/-+/g, '-')
                  .replace(/^-+|-+$/g, '');
                setForm((p) => ({ ...p, name, slug }));
              }} 
              required 
              style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Slug</label>
            <input 
              placeholder="e.g. football" 
              value={form.slug} 
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} 
              required 
              style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Banner Image</label>
            <div style={{ 
              border: '2px dashed #e2e8f0', 
              borderRadius: '12px', 
              padding: '24px', 
              textAlign: 'center',
              background: '#f8fafc',
              position: 'relative',
              cursor: 'pointer'
            }}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload} 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} 
              />
              <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                {uploading ? '⏳ Uploading...' : '📁 Click to upload or drag & drop'}
              </span>
              {form.bannerUrl && (
                <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#166534', fontWeight: 700 }}>
                  ✓ File ready: {form.bannerUrl.split('/').pop()}
                </div>
              )}
            </div>

            {form.bannerUrl && (
              <div style={{ 
                marginTop: '12px', 
                borderRadius: '16px', 
                overflow: 'hidden', 
                height: '150px', 
                border: '4px solid #f1f5f9',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <img 
                  src={form.bannerUrl} 
                  alt="Banner Preview" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, zIndex: 1 }}
                  onError={(e) => { e.target.style.opacity = 0; }}
                  onLoad={(e) => { e.target.style.opacity = 1; }}
                />
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', gridColumn: 'span 2' }}>
            <button 
              type="submit" 
              className="mc-btn mc-btn-primary" 
              disabled={!hasChanges()}
              style={{ 
                flex: 2, 
                padding: '14px',
                opacity: !hasChanges() ? 0.5 : 1,
                cursor: !hasChanges() ? 'not-allowed' : 'pointer'
              }}
            >
              {editingId ? 'Update Sport' : 'Create Sport'}
            </button>
            {editingId && (
              <button 
                type="button" 
                onClick={clearForm}
                className="mc-btn mc-btn-secondary" 
                style={{ flex: 1, padding: '14px', background: '#f3f4f6', color: '#4b5563', border: 'none' }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {sports.map((sport) => (
          <article className="card" key={sport.id} style={{ padding: '0', overflow: 'hidden', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '20px', background: '#fff' }}>
            {sport.banner_url ? (
              <div style={{ width: '100%', height: '140px', background: `url(${sport.banner_url}) center/cover` }} />
            ) : (
              <div style={{ width: '100%', height: '140px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                No Banner
              </div>
            )}
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>{sport.name}</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Slug: {sport.slug}</p>
                </div>
                <button 
                  onClick={() => editSport(sport)}
                  style={{ 
                    background: '#fef3c7', 
                    border: '1px solid #f59e0b', 
                    color: '#92400e',
                    padding: '6px 12px', 
                    borderRadius: '8px', 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    cursor: 'pointer' 
                  }}
                >
                  Edit
                </button>
              </div>
              <button 
                type="button" 
                onClick={() => deleteSport(sport.id)}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '10px', 
                  background: 'transparent', 
                  color: '#dc2626', 
                  border: '1px solid #fee2e2',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Delete Category
              </button>
            </div>
          </article>
        ))}
      </div>

      {confirmModal.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ padding: '32px', maxWidth: '400px', width: '90%', borderRadius: '24px', border: 'none', background: '#fff', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '16px' }}>
              {confirmModal.type === 'delete' ? 'Delete Sport?' : 'Update Sport?'}
            </h2>
            <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '0.95rem' }}>
              {confirmModal.type === 'delete' 
                ? 'This action is permanent and will remove this sport from the system.' 
                : 'Are you sure you want to save these changes?'}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => confirmModal.type === 'delete' ? executeDelete(confirmModal.target) : executeSubmit()}
                className="mc-btn mc-btn-primary" 
                style={{ flex: 1, padding: '12px', background: confirmModal.type === 'delete' ? '#dc2626' : '#111827' }}
              >
                Confirm
              </button>
              <button 
                onClick={() => setConfirmModal({ show: false, type: null, target: null })}
                className="mc-btn mc-btn-secondary" 
                style={{ flex: 1, padding: '12px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

