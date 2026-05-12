import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { sportService } from '../../services/sportService'
import { unwrapData } from '../../utils/apiData'
import FormModal from '../../components/ui/FormModal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import FileUploadField from '../../components/ui/FileUploadField'

export default function SportsManagePage() {
  const [sports, setSports] = useState([])
  const [form, setForm] = useState({ name: '', slug: '', bannerUrl: '' })
  const [initialForm, setInitialForm] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ show: false, type: null, target: null })
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)

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

  const editSport = (sport) => {
    const sportData = { 
      name: sport.name, 
      slug: sport.slug, 
      bannerUrl: sport.banner_url || '' 
    }
    setEditingId(sport.id)
    setForm(sportData)
    setInitialForm(sportData)
    setIsFormModalOpen(true)
  }

  const clearForm = () => {
    setEditingId(null)
    setInitialForm(null)
    setForm({ name: '', slug: '', bannerUrl: '' })
    setIsFormModalOpen(false)
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
      <div className="section-head" style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '3rem', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '-2px', color: '#111827', lineHeight: 1, margin: 0 }}>Sports</h1>
          <p className="section-subtitle" style={{ fontSize: '1rem', color: '#6b7280', marginTop: '8px' }}>
            Manage sports categories and their visual representations.
          </p>
        </div>
        <button 
          onClick={() => { clearForm(); setIsFormModalOpen(true); }}
          style={{ padding: '14px 28px', borderRadius: '12px', background: '#111827', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
        >
          + Add Category
        </button>
      </div>

      {/* Form Modal */}
      <FormModal
        isOpen={isFormModalOpen}
        onClose={clearForm}
        onSubmit={handleSubmit}
        title={editingId ? 'Edit Sport Category' : 'Create New Category'}
        submitLabel={editingId ? 'Save Changes' : 'Create Sport'}
        submitDisabled={!hasChanges()}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px' }}>Sport Name</label>
            <input 
              placeholder="e.g. Football" 
              value={form.name} 
              onChange={(e) => {
                const name = e.target.value;
                const slug = name.toLowerCase()
                  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                  .replace(/[đĐ]/g, 'd')
                  .replace(/([^0-9a-z-\s])/g, '')
                  .replace(/(\s+)/g, '-')
                  .replace(/-+/g, '-')
                  .replace(/^-+|-+$/g, '');
                setForm((p) => ({ ...p, name, slug }));
              }} 
              required 
              style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px' }}>Slug</label>
            <input 
              placeholder="e.g. football" 
              value={form.slug} 
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} 
              required 
              style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', outline: 'none' }}
            />
          </div>
        </div>

        <FileUploadField
          label="Banner Image"
          value={form.bannerUrl}
          onChange={(url) => setForm((p) => ({ ...p, bannerUrl: url }))}
          previewType="banner"
          icon="🖼️"
          placeholder="Click or drag & drop banner image"
        />
      </FormModal>

      {/* Sport Cards */}
      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {sports.map((sport) => (
          <article className="card" key={sport.id} style={{ padding: '0', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '20px', background: '#fff' }}>
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
                  border: '1px solid #fca5a5',
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

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.show}
        onClose={() => setConfirmModal({ show: false, type: null, target: null })}
        onConfirm={() => confirmModal.type === 'delete' ? executeDelete(confirmModal.target) : executeSubmit()}
        title={confirmModal.type === 'delete' ? 'Delete Sport?' : 'Update Sport?'}
        message={confirmModal.type === 'delete'
          ? 'This action is permanent and will remove this sport from the system.'
          : 'Are you sure you want to save these changes?'}
        confirmLabel="Confirm"
        variant={confirmModal.type === 'delete' ? 'danger' : 'default'}
      />
    </section>
  )
}
