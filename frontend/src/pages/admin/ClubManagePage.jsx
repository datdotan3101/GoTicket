import { useEffect, useState } from 'react'
import { MoreVertical, Edit2, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { clubService } from '../../services/clubService'
import { sportService } from '../../services/sportService'
import { leagueService } from '../../services/leagueService'
import { unwrapData } from '../../utils/apiData'
import '../../common/AdminStyles.css'
import FormModal from '../../components/ui/FormModal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import FileUploadField from '../../components/ui/FileUploadField'
import KebabMenu from '../../components/ui/KebabMenu'

export default function ClubManagePage() {
  const [clubs, setClubs] = useState([])
  const [sports, setSports] = useState([])
  const [leagues, setLeagues] = useState([])
  const [form, setForm] = useState({ name: '', logoUrl: '', sportId: '', leagueId: '' })
  const [initialForm, setInitialForm] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ show: false, type: null, target: null })
  const [searchTerm, setSearchTerm] = useState('')
  const [activeLeagueTab, setActiveLeagueTab] = useState('V.League 1')
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [clubsRes, sportsRes, leaguesRes] = await Promise.all([
          clubService.getAll({ limit: 200 }),
          sportService.getAll(),
          leagueService.getAll()
        ])
        const clubsPayload = unwrapData(clubsRes)
        setClubs(clubsPayload?.data ?? clubsPayload ?? [])
        setSports(unwrapData(sportsRes) || [])
        const leaguePayload = unwrapData(leaguesRes)
        setLeagues(leaguePayload?.data ?? leaguePayload ?? [])
      } catch {
        setClubs([])
        setSports([])
        setLeagues([])
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
    
    const errors = []
    if (!form.name.trim()) errors.push('Club Name')
    if (!form.sportId) errors.push('Sport Category')
    if (!form.leagueId) errors.push('League')
    if (!form.logoUrl) errors.push('Club Logo')

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
        logoUrl: form.logoUrl || undefined,
        sportId: form.sportId ? parseInt(form.sportId) : undefined,
        leagueId: form.leagueId ? parseInt(form.leagueId) : undefined,
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
      leagueId: club.league_id ? String(club.league_id) : '',
    }
    setEditingId(club.id)
    setForm(data)
    setInitialForm(data)
    setIsFormModalOpen(true)
  }

  const clearForm = () => {
    setEditingId(null)
    setInitialForm(null)
    setForm({ name: '', logoUrl: '', sportId: '', leagueId: '' })
    setIsFormModalOpen(false)
  }

  const hasChanges = () => {
    if (!editingId || !initialForm) return true
    return (
      form.name !== initialForm.name ||
      form.logoUrl !== initialForm.logoUrl ||
      form.sportId !== initialForm.sportId ||
      form.leagueId !== initialForm.leagueId
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

  const filteredClubs = clubs.filter((c) => {
    const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTab = c.league_name === activeLeagueTab
    return matchesSearch && matchesTab
  })

  const getSportName = (sportId) => {
    const sport = sports.find((s) => s.id === sportId)
    return sport ? sport.name : null
  }

  return (
    <section className="container page" style={{ border: 'none', background: 'transparent', paddingBottom: '60px' }}>
      {/* Header */}
      <div className="section-head" style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="admin-header">
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
          <label className="admin-label">Club Name *</label>
          <input
            placeholder="e.g. Manchester United"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="admin-input"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="admin-label">Sport Category</label>
          <select
            value={form.sportId}
            onChange={(e) => setForm((p) => ({ ...p, sportId: e.target.value }))}
            className="admin-input"
          >
            <option value="">— Select Category —</option>
            {sports.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="admin-label">League</label>
          <select
            value={form.leagueId}
            onChange={(e) => setForm((p) => ({ ...p, leagueId: e.target.value }))}
            className="admin-input"
          >
            <option value="">— Select League —</option>
            {leagues.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        <FileUploadField
          label="Club Logo"
          value={form.logoUrl}
          onChange={(url) => setForm((p) => ({ ...p, logoUrl: url }))}
          previewType="logo"
          placeholder="Click or drag to upload club logo"
        />
      </FormModal>

      {/* Search and Tabs */}
      <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

        {/* League Tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0' }}>
          {[...leagues].sort((a, b) => a.name.localeCompare(b.name)).map(l => (
            <button
              key={l.id}
              onClick={() => setActiveLeagueTab(l.name)}
              style={{
                padding: '8px 20px',
                borderRadius: '999px',
                border: 'none',
                background: activeLeagueTab === l.name ? '#111827' : '#f1f5f9',
                color: activeLeagueTab === l.name ? '#fff' : '#64748b',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>

      {/* Club Cards */}
      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
        {filteredClubs.map((club) => {
          const sportName = getSportName(club.sport_id)
          return (
            <article className="card" key={club.id} style={{ padding: '0', overflow: 'visible', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: '20px', background: '#fff' }}>
              {/* Card Header */}
              <div style={{ background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', padding: '28px 24px', display: 'flex', alignItems: 'center', gap: '16px', borderRadius: 'inherit' }}>
                <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', background: '#fff', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, color: '#3b82f6' }}>
                    {club.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  {club.logo_url && (
                    <img
                      src={club.logo_url}
                      alt={club.name}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#fff', padding: '6px' }}
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>{club.name}</h3>
                  {sportName && (
                    <span style={{ display: 'inline-block', marginTop: '6px', marginRight: '6px', background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
                      {sportName}
                    </span>
                  )}
                  {club.league_name && (
                    <span style={{ display: 'inline-block', marginTop: '6px', background: '#fce7f3', color: '#be185d', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
                      {club.league_name}
                    </span>
                  )}
                </div>

                <KebabMenu 
                  onEdit={() => editClub(club)} 
                  onDelete={() => deleteClub(club.id)} 
                />
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
