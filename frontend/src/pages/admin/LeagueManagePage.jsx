/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Calendar, 
  Trophy, 
  Activity
} from 'lucide-react'
import { leagueService } from '../../services/leagueService'
import { sportService } from '../../services/sportService'
import { unwrapData } from '../../utils/apiData'
import { formatDateTime } from '../../utils/formatDate'
import '../../common/AdminStyles.css'
import FormModal from '../../components/ui/FormModal'
import ConfirmModal from '../../components/ui/ConfirmModal'

export default function LeagueManagePage() {
  const [leagues, setLeagues] = useState([])
  const [sports, setSports] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingLeague, setEditingLeague] = useState(null)
  const [leagueToDelete, setLeagueToDelete] = useState(null)
  
  // Form state
  const initialForm = { 
    name: '', 
    sportId: '', 
    season: '', 
    logoUrl: '',
    startDate: null,
    endDate: null
  }
  const [form, setForm] = useState(initialForm)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [leaguesRes, sportsRes] = await Promise.all([
        leagueService.getAll({ limit: 100 }),
        sportService.getAll(),
      ])
      const leaguesPayload = unwrapData(leaguesRes)
      setLeagues(leaguesPayload?.data || leaguesPayload || [])
      setSports(unwrapData(sportsRes) || [])
    } catch (error) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (league = null) => {
    if (league) {
      setEditingLeague(league)
      setForm({
        name: league.name,
        sportId: league.sport_id,
        season: league.season || '',
        logoUrl: league.logo_url || '',
        startDate: league.start_date ? new Date(league.start_date) : null,
        endDate: league.end_date ? new Date(league.end_date) : null
      })
    } else {
      setEditingLeague(null)
      setForm(initialForm)
    }
    setIsModalOpen(true)
  }

  const isFormChanged = () => {
    if (!editingLeague) return true // Always enabled for creation
    
    const original = {
      name: editingLeague.name,
      sportId: String(editingLeague.sport_id),
      season: editingLeague.season || '',
      logoUrl: editingLeague.logo_url || '',
      startDate: editingLeague.start_date ? new Date(editingLeague.start_date).getTime() : null,
      endDate: editingLeague.end_date ? new Date(editingLeague.end_date).getTime() : null
    }
    
    const current = {
      name: form.name,
      sportId: String(form.sportId),
      season: form.season,
      logoUrl: form.logoUrl,
      startDate: form.startDate ? new Date(form.startDate).getTime() : null,
      endDate: form.endDate ? new Date(form.endDate).getTime() : null
    }
    
    return JSON.stringify(original) !== JSON.stringify(current)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { 
        ...form, 
        sportId: Number(form.sportId)
      }
      
      if (editingLeague) {
        await leagueService.update(editingLeague.id, payload)
        toast.success('League updated successfully')
      } else {
        await leagueService.create(payload)
        toast.success('League created successfully')
      }
      
      setIsModalOpen(false)
      fetchAll()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async () => {
    if (!leagueToDelete) return
    try {
      await leagueService.remove(leagueToDelete.id)
      toast.success('League deleted successfully')
      setIsDeleteModalOpen(false)
      setLeagueToDelete(null)
      fetchAll()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete league')
    }
  }

  const filteredLeagues = leagues.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isEnded = (endDate) => {
    if (!endDate) return false
    return new Date(endDate) < new Date()
  }

  return (
    <section className="container manager-create-page">
      <div className="league-manage-header">
        <div className="mc-header-left">
          <h1>Leagues Management</h1>
          <p className="mc-subtitle">Create and manage your professional sports leagues</p>
        </div>
        <button className="mc-btn mc-btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} style={{ marginRight: '8px' }} />
          Create League
        </button>
      </div>

      <div className="hero-search-box" style={{ marginBottom: '30px', maxWidth: '100%' }}>
        <div className="hs-input-wrap">
          <Search size={20} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Search leagues by name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
      ) : (
        <div className="league-grid">
          {filteredLeagues.map((league) => (
            <article className="league-card" key={league.id}>
              <div className="league-card-banner">
                <div className="league-card-logo-wrap">
                  {league.logo_url ? (
                    <img src={league.logo_url} alt={league.name} className="league-card-logo" />
                  ) : (
                    <Trophy size={32} color="#cbd5e1" />
                  )}
                </div>
              </div>
              <div className="league-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 className="league-card-name">{league.name}</h3>
                  {isEnded(league.end_date) ? (
                    <span className="status-badge end">End</span>
                  ) : (
                    <span className="status-badge active">Active</span>
                  )}
                </div>
                
                <div className="league-card-meta">
                  <Activity size={14} />
                  <span>{league.sport_name || 'Unknown Sport'}</span>
                  {league.season && (
                    <>
                      <span>•</span>
                      <span>Season {league.season}</span>
                    </>
                  )}
                </div>

                <div className="league-card-dates">
                  <div className="league-date-item">
                    <Calendar size={14} />
                    <span>Start: {formatDateTime(league.start_date, 'dd/MM/yyyy')}</span>
                  </div>
                  <div className="league-date-item">
                    <Calendar size={14} />
                    <span>End: {formatDateTime(league.end_date, 'dd/MM/yyyy')}</span>
                  </div>
                </div>
              </div>
              
              <div className="league-card-footer">
                <div className="league-actions">
                  <button className="btn-icon" onClick={() => handleOpenModal(league)}>
                    <Edit2 size={16} />
                  </button>
                  <button className="btn-icon delete" onClick={() => { setLeagueToDelete(league); setIsDeleteModalOpen(true); }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingLeague ? 'Edit League' : 'Create New League'}
        submitLabel={editingLeague ? 'Save Changes' : 'Create League'}
        submitDisabled={editingLeague && !isFormChanged()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="admin-label">League Name</label>
          <input 
            placeholder="e.g. Premier League" 
            value={form.name} 
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} 
            required 
            className="admin-input"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="admin-label">Sport</label>
            <select 
              value={form.sportId} 
              onChange={(e) => setForm((p) => ({ ...p, sportId: e.target.value }))} 
              required
              className="admin-input"
            >
              <option value="">Select sport</option>
              {sports.map((sport) => (
                <option key={sport.id} value={sport.id}>{sport.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="admin-label">Season</label>
            <input 
              placeholder="e.g. 2023-24" 
              value={form.season} 
              onChange={(e) => setForm((p) => ({ ...p, season: e.target.value }))}
              className="admin-input"
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="admin-label">Logo URL</label>
          <input 
            placeholder="https://example.com/logo.png" 
            value={form.logoUrl} 
            onChange={(e) => setForm((p) => ({ ...p, logoUrl: e.target.value }))}
            className="admin-input"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="admin-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} /> Start Date
            </label>
            <DatePicker
              selected={form.startDate}
              onChange={(date) => setForm((p) => ({ ...p, startDate: date }))}
              placeholderText="Select start date"
              dateFormat="dd/MM/yyyy"
              wrapperClassName="datepicker-full-width"
              className="admin-input datepicker-input"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="admin-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} /> End Date
            </label>
            <DatePicker
              selected={form.endDate}
              onChange={(date) => setForm((p) => ({ ...p, endDate: date }))}
              placeholderText="Select end date"
              dateFormat="dd/MM/yyyy"
              minDate={form.startDate}
              wrapperClassName="datepicker-full-width"
              className="admin-input datepicker-input"
            />
          </div>
        </div>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Confirm Delete"
        message={<>Are you sure you want to delete <strong>{leagueToDelete?.name}</strong>? This action cannot be undone.</>}
        confirmLabel="Delete League"
        variant="danger"
      />
    </section>
  )
}
