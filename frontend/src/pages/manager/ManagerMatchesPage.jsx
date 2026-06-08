import { useEffect, useState, Suspense, lazy } from 'react'
import { Link } from 'react-router-dom'
import Pagination from '../../components/ui/Pagination'
const ManagerMatchCard = lazy(() => import('../../components/manager/ManagerMatchCard'))
import { usePagination } from '../../hooks/usePagination'
import { toast } from 'react-toastify'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { 
  Plus, 
  Calendar
} from 'lucide-react'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { APP_ROUTES } from '../../constants/routes'
import { dashboardService } from '../../services/dashboardService'
import { matchService } from '../../services/matchService'
import { stadiumService } from '../../services/stadiumService'
import MatchEditModal from '../../components/manager/MatchEditModal'
import { unwrapData } from '../../utils/apiData'

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

  const {
    currentPage,
    setCurrentPage,
    paginatedItems,
    totalPages
  } = usePagination(filteredMatches, 6, activeTab)

  if (loading) {
    return (
      <div style={{ padding: '100px 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-slate-500)', fontWeight: 600 }}>Loading matches...</p>
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
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--color-slate-200)', paddingBottom: '16px' }}>
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
              background: activeTab === tab.id ? 'var(--color-slate-800)' : 'transparent',
              color: activeTab === tab.id ? 'var(--color-white)' : 'var(--color-slate-500)',
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
        <Suspense fallback={[1, 2, 3].map(i => <div key={i} className="si-skeleton-card" style={{ height: '400px', background: 'var(--color-slate-100)', borderRadius: '16px' }} />)}>
          {paginatedItems.map((match) => (
            <ManagerMatchCard 
              key={match.match_id} 
              match={match} 
              onOpenEdit={handleOpenEdit} 
              onDelete={setMatchToDelete} 
            />
          ))}
        </Suspense>

        <ConfirmModal 
          isOpen={!!matchToDelete}
          onClose={() => setMatchToDelete(null)}
          onConfirm={handleDeleteMatch}
          title="Delete Match Campaign"
          message="Are you sure you want to delete this match campaign? All associated seats and stands will be permanently removed."
          confirmLabel="Delete Match"
        />

        {filteredMatches.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', background: 'var(--color-white)', borderRadius: '20px', border: '1px dashed var(--color-slate-200)' }}>
            <Calendar size={48} color="var(--color-slate-300)" style={{ margin: '0 auto 20px' }} />
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-slate-800)' }}>No matches found</h3>
            <p style={{ color: 'var(--color-slate-500)', margin: '0 0 20px 0' }}>There are no matches in this category.</p>
            {activeTab === 'approved' && (
              <Link className="mc-btn mc-btn-primary" to={APP_ROUTES.MANAGER_MATCH_CREATE} style={{ display: 'inline-flex', marginTop: '12px' }}>
                <Plus size={18} style={{ marginRight: '8px' }} />
                Create New Match
              </Link>
            )}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

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
