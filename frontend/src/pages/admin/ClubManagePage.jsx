import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { clubService } from '../../services/clubService'
import { sportService } from '../../services/sportService'
import { unwrapData } from '../../utils/apiData'
import FormModal from '../../components/ui/FormModal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import FileUploadField from '../../components/ui/FileUploadField'

export default function ClubManagePage() {
  const [clubs, setClubs] = useState([])
  const [sports, setSports] = useState([])
  const [form, setForm] = useState({ name: '', logoUrl: '', sportId: '' })
  const [initialForm, setInitialForm] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ show: false, type: null, target: null })
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [clubsRes, sportsRes] = await Promise.all([
          clubService.getAll({ limit: 200 }),
          sportService.getAll(),
        ])
        const clubsPayload = unwrapData(clubsRes)
        setClubs(clubsPayload?.data ?? clubsPayload ?? [])
        setSports(unwrapData(sportsRes) || [])
      } catch {
        setClubs([])
        setSports([])
      }
    }
    fetchAll()
  }, [])

  const refresh = async () => {
    try {
      const res = await clubService.getAll({ limit: 200 })
      const payload = unwrapData(res)
      setClubs(payload?.data ?? payload ?? [])
    } catch {
      setClubs([])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Club name is required.')
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
        logoUrl: form.logoUrl || undefined,
        sportId: form.sportId ? parseInt(form.sportId) : undefined,
      }
      if (editingId) {
        await clubService.update(editingId, payload)
        toast.success('Club updated successfully.')
      } else {
        await clubService.create(payload)
        toast.success('Club created successfully.')
      }
      clearForm()
      refresh()
      setConfirmModal({ show: false, type: null, target: null })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed.')
    }
  }

  const editClub = (club) => {
    const data = {
      name: club.name,
      logoUrl: club.logo_url || '',
      sportId: club.sport_id ? String(club.sport_id) : '',
    }
    setEditingId(club.id)
    setForm(data)
    setInitialForm(data)
    setIsFormModalOpen(true)
  }

  const clearForm = () => {
    setEditingId(null)
    setInitialForm(null)
    setForm({ name: '', logoUrl: '', sportId: '' })
    setIsFormModalOpen(false)
  }

  const hasChanges = () => {
    if (!editingId || !initialForm) return true
    return (
      form.name !== initialForm.name ||
      form.logoUrl !== initialForm.logoUrl ||
      form.sportId !== initialForm.sportId
    )
  }

  const deleteClub = (id) => {
    setConfirmModal({ show: true, type: 'delete', target: id })
  }

  const executeDelete = async (id) => {
    try {
      await clubService.remove(id)
      refresh()
      toast.success('Club removed.')
      setConfirmModal({ show: false, type: null, target: null })
    } catch {
      toast.error('Cannot delete club.')
    }
  }

  const filteredClubs = clubs.filter((c) =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getSportName = (sportId) => {
    const sport = sports.find((s) => s.id === sportId)
    return sport ? sport.name : null
  }

  return (
    <section className="container page" style={{ border: 'none', background: 'transparent', paddingBottom: '60px' }}>
      {/* Header */}
      <div className="section-head" style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '3rem', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '-2px', color: '#111827', lineHeight: 1, margin: 0 }}>
            Clubs
          </h1>
          <p className="section-subtitle" style={{ fontSize: '1rem', color: '#6b7280', marginTop: '8px' }}>
            Manage sports clubs and their associated sport categories.
          </p>
        </div>
        <button 
          onClick={() => { clearForm(); setIsFormModalOpen(true); }}
          style={{ padding: '14px 28px', borderRadius: '12px', background: '#111827', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
        >
          + Add New Club
        </button>
      </div>

      {/* Form Modal */}
      <FormModal
        isOpen={isFormModalOpen}
        onClose={clearForm}
        onSubmit={handleSubmit}
        title={editingId ? 'Edit Club' : 'Create New Club'}
        submitLabel={editingId ? 'Save Changes' : 'Create Club'}
        submitDisabled={!hasChanges()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px' }}>Club Name *</label>
          <input
            placeholder="e.g. Manchester United"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
            style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '1rem', background: '#f8fafc' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px' }}>Sport Category</label>
          <select
            value={form.sportId}
            onChange={(e) => setForm((p) => ({ ...p, sportId: e.target.value }))}
            style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '1rem', background: '#f8fafc' }}
          >
            <option value="">— Select Category —</option>
            {sports.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <FileUploadField
          label="Club Logo"
          value={form.logoUrl}
          onChange={(url) => setForm((p) => ({ ...p, logoUrl: url }))}
          previewType="logo"
          icon="📁"
          placeholder="Click to upload club logo"
        />
      </FormModal>

      {/* Search */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <input
          type="text"
          placeholder="Search clubs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem', width: '280px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
        />
        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
          {filteredClubs.length} club{filteredClubs.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Club Cards */}
      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
        {filteredClubs.map((club) => {
          const sportName = getSportName(club.sport_id)
          return (
            <article className="card" key={club.id} style={{ padding: '0', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: '20px', background: '#fff' }}>
              {/* Card Header */}
              <div style={{ background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', padding: '28px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                {club.logo_url ? (
                  <img
                    src={club.logo_url}
                    alt={club.name}
                    style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '12px', background: '#fff', padding: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, color: '#3b82f6', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    {club.name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>{club.name}</h3>
                  {sportName && (
                    <span style={{ display: 'inline-block', marginTop: '6px', background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
                      {sportName}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Actions */}
              <div style={{ padding: '16px 24px', display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => editClub(club)}
                  style={{
                    flex: 1,
                    background: '#fef3c7',
                    border: '1px solid #f59e0b',
                    color: '#92400e',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteClub(club.id)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'transparent',
                    color: '#dc2626',
                    border: '1px solid #fca5a5',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </article>
          )
        })}

        {filteredClubs.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#94a3b8', background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            No clubs found.
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.show}
        onClose={() => setConfirmModal({ show: false, type: null, target: null })}
        onConfirm={() => confirmModal.type === 'delete' ? executeDelete(confirmModal.target) : executeSubmit()}
        title={confirmModal.type === 'delete' ? 'Delete Club?' : 'Update Club?'}
        message={confirmModal.type === 'delete'
          ? 'This action is permanent and will remove this club from the system.'
          : 'Are you sure you want to save these changes?'}
        confirmLabel="Confirm"
        variant={confirmModal.type === 'delete' ? 'danger' : 'default'}
      />
    </section>
  )
}
