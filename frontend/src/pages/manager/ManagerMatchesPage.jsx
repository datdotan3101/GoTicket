import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { 
  Plus, 
  Calendar, 
  BarChart2, 
  Settings, 
  Edit3,
  MapPin,
  Clock,
  X,
  Map,
  Shield,
  FileText,
  Trash2
} from 'lucide-react'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { APP_ROUTES } from '../../constants/routes'
import { dashboardService } from '../../services/dashboardService'
import { matchService } from '../../services/matchService'
import { stadiumService } from '../../services/stadiumService'
import MatchEditModal from '../../components/manager/MatchEditModal'
import { unwrapData } from '../../utils/apiData'
import { formatVND } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'

export default function ManagerMatchesPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [stadiums, setStadiums] = useState([])
  
  // Tab state
  const [activeTab, setActiveTab] = useState('pending') // 'pending', 'approved', 'ended'

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingMatch, setEditingMatch] = useState(null)

  // Delete modal state
  const [matchToDelete, setMatchToDelete] = useState(null)

  useEffect(() => {
    fetchAll()
    fetchStadiums()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const response = await dashboardService.getManagerRevenue()
      const payload = unwrapData(response)
      if (payload && payload.byMatch) {
        setData(payload.byMatch)
      } else {
        setData([])
      }
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStadiums = async () => {
    try {
      const res = await stadiumService.getAll()
      setStadiums(unwrapData(res) || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handleOpenEdit = (match) => {
    setEditingMatch(match)
    setIsEditModalOpen(true)
  }

  const handleUpdateMatch = async (payload) => {
    try {
      await matchService.update(editingMatch.match_id, payload)
      toast.success('Match updated successfully')
      setIsEditModalOpen(false)
      fetchAll()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed')
    }
  }

  const handleSubmitForReview = async () => {
    try {
      await matchService.submit(editingMatch.match_id)
      toast.success('Submitted for approval')
      setIsEditModalOpen(false)
      fetchAll()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submit failed')
    }
  }

  const handleDeleteMatch = async () => {
    if (!matchToDelete) return
    try {
      await matchService.delete(matchToDelete)
      toast.success('Match deleted successfully')
      setMatchToDelete(null)
      fetchAll()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed')
    }
  }

  // Filter matches based on active tab
  const filteredMatches = data.filter(match => {
    const isEnded = new Date(match.match_date) < new Date()
    if (activeTab === 'ended') return isEnded
    if (activeTab === 'pending') return !isEnded && ['draft', 'pending_review', 'rejected'].includes(match.status)
    if (activeTab === 'approved') return !isEnded && ['approved', 'published'].includes(match.status)
    return false
  })

  if (loading) {
    return (
      <div style={{ padding: '100px 0', textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontWeight: 600 }}>Loading matches...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="dashboard-header" style={{ marginBottom: '24px' }}>
        <div className="dashboard-header-left">
          <h1 className="dashboard-title">Match Management</h1>
          <p className="dashboard-subtitle">Manage your match campaigns and configurations</p>
        </div>
        <div>
          <Link className="mc-btn mc-btn-primary" to={APP_ROUTES.MANAGER_MATCH_CREATE} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} />
            Create Match
          </Link>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        {[
          { id: 'pending', label: 'Pending match' },
          { id: 'approved', label: 'Published match' },
          { id: 'ended', label: 'Ended match' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: activeTab === tab.id ? '#1e293b' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#64748b',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="manager-match-grid">
        {filteredMatches.map((match) => (
          <article key={match.match_id} className="manager-match-card" style={{ position: 'relative' }}>
            {new Date(match.match_date) < new Date() ? (
              <span className="status-badge end" style={{ 
                position: 'absolute', 
                top: '12px', 
                right: '12px', 
                zIndex: 1,
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
              }}>
                The End
              </span>
            ) : match.status === 'pending_review' ? (
              <span className="status-badge" style={{ 
                position: 'absolute', 
                top: '12px', 
                right: '12px', 
                zIndex: 1,
                background: '#f59e0b',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
              }}>
                Pending
              </span>
            ) : (
              <span className="status-badge approved" style={{ 
                position: 'absolute', 
                top: '12px', 
                right: '12px', 
                zIndex: 1,
                background: '#10b981',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}>
                {match.status === 'published' ? 'Published' : 'Approved'}
              </span>
            )}
            <div className="mmc-head">
              <div className="mmc-teams">
                <span className="mmc-team-name">{match.home_team}</span>
                <span className="mmc-vs">vs</span>
                <span className="mmc-team-name">{match.away_team}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
                  <Calendar size={14} />
                  <span>{formatDateTime(match.match_date, 'dd/MM/yyyy')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
                  <Clock size={14} />
                  <span>{match.match_date ? new Date(match.match_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                </div>
              </div>
              {match.ticket_sale_open_at && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f97316', fontSize: '0.7rem', fontWeight: 700, marginTop: '8px', background: '#fff7ed', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ffedd5', width: 'fit-content' }}>
                  <span style={{ fontSize: '10px' }}>🛒</span>
                  <span>SALE OPENS: {formatDateTime(match.ticket_sale_open_at)}</span>
                </div>
              )}
            </div>
            
            <div className="mmc-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', fontSize: '0.85rem', fontWeight: 700 }}>
                  <MapPin size={16} color="#ef4444" />
                  <span>{match.stadium_name || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, paddingLeft: '24px' }}>
                  <Map size={14} color="#94a3b8" />
                  <span>{match.stadium_city || 'N/A'}</span>
                </div>
              </div>

              <div className="mmc-metric-row">
                <div className="mmc-metric">
                  <span className="mmc-metric-label">Revenue Generated</span>
                  <span className="mmc-metric-value" style={{ color: '#16a34a' }}>{formatVND(match.revenue)}</span>
                </div>
                <div className="mmc-metric">
                  <span className="mmc-metric-label">Tickets Sold</span>
                  <span className="mmc-metric-value">{match.tickets_sold}</span>
                </div>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className={`status-badge ${['published', 'approved'].includes(match.status) ? 'approved' : match.status === 'rejected' ? 'rejected' : 'draft'}`}>
                  {match.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            <div className="mmc-footer">
              {!['approved', 'published'].includes(match.status) && (
                <>
                  <button 
                    className="mmc-btn" 
                    onClick={() => handleOpenEdit(match)}
                  >
                    <Edit3 size={14} style={{ marginBottom: '4px', display: 'block', margin: '0 auto 4px' }} />
                    Edit
                  </button>
                  <Link className="mmc-btn" to={`/manager/matches/${match.match_id}/stand-config`}>
                    <Settings size={14} style={{ marginBottom: '4px', display: 'block', margin: '0 auto 4px' }} />
                    Stands
                  </Link>
                </>
              )}
              <Link className="mmc-btn mmc-btn-primary" to={`/manager/matches/${match.match_id}/analytics`} style={{ flex: ['approved', 'published'].includes(match.status) ? 1 : 'unset' }}>
                <BarChart2 size={14} style={{ marginBottom: '4px', display: 'block', margin: '0 auto 4px' }} />
                Analytics
              </Link>
              {['draft', 'pending_review', 'rejected'].includes(match.status) && (
                <button 
                  className="mmc-btn" 
                  onClick={() => setMatchToDelete(match.match_id)}
                  style={{ color: '#ef4444' }}
                >
                  <Trash2 size={14} style={{ marginBottom: '4px', display: 'block', margin: '0 auto 4px' }} />
                  Delete
                </button>
              )}
            </div>
          </article>
        ))}

        <ConfirmModal 
          isOpen={!!matchToDelete}
          onClose={() => setMatchToDelete(null)}
          onConfirm={handleDeleteMatch}
          title="Delete Match Campaign"
          message="Are you sure you want to delete this match campaign? All associated seats and stands will be permanently removed."
          confirmLabel="Delete Match"
        />

        {filteredMatches.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', background: '#fff', borderRadius: '20px', border: '1px dashed #e2e8f0' }}>
            <Calendar size={48} color="#cbd5e1" style={{ margin: '0 auto 20px' }} />
            <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>No matches found</h3>
            <p style={{ color: '#64748b', margin: '0 0 20px 0' }}>There are no matches in this category.</p>
            {activeTab === 'approved' && (
              <Link className="mc-btn mc-btn-primary" to={APP_ROUTES.MANAGER_MATCH_CREATE} style={{ display: 'inline-flex', marginTop: '12px' }}>
                <Plus size={18} style={{ marginRight: '8px' }} />
                Create New Match
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Edit Match Modal */}
      <MatchEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        match={editingMatch}
        stadiums={stadiums}
        onUpdate={handleUpdateMatch}
        onSubmitForReview={handleSubmitForReview}
      />
    </div>
  )
}
