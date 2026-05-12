import { useEffect, useState } from 'react'
import { matchService } from '../../services/matchService'
import { approvalsService } from '../../services/approvalsService'
import { unwrapData } from '../../utils/apiData'
import { formatDateTime } from '../../utils/formatDate'
import { formatVND } from '../../utils/formatCurrency'
import toast from 'react-hot-toast'
import { Eye, MapPin, Calendar, Clock, X, Check, XCircle, Users } from 'lucide-react'

const DUMMY_IMAGES = [
  'https://images.unsplash.com/photo-1518605368461-1ee0676644ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1540747913346-19e32fc3e6ed?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1508344928928-7137b29de218?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
]

export default function MatchManagePage() {
  const [activeTab, setActiveTab] = useState('pending') // pending, approved
  const [matches, setMatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Modals for pending approval
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const fetchMatches = async () => {
    setIsLoading(true)
    try {
      if (activeTab === 'pending') {
        const response = await approvalsService.getPending({ type: 'match' })
        setMatches(unwrapData(response) || [])
      } else if (activeTab === 'approved') {
        const response = await matchService.getAll({ status: 'published,approved', limit: 100 })
        const payload = unwrapData(response)
        setMatches(payload?.data ?? payload ?? [])
      }
    } catch (error) {
      setMatches([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMatches()
  }, [activeTab])

  const onApprove = async (id) => {
    try {
      await approvalsService.approve(id)
      toast.success('Match approved successfully.')
      fetchMatches()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Approve failed.')
    }
  }

  const handleRejectClick = (id) => {
    setRejectingId(id)
    setRejectReason('')
  }

  const submitReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection.')
      return
    }
    try {
      await approvalsService.reject(rejectingId, rejectReason.trim())
      toast.success('Match rejected.')
      fetchMatches()
      setRejectingId(null)
      if (selectedMatch && selectedMatch.id === rejectingId) {
        setSelectedMatch(null)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Reject failed.')
    }
  }

  const renderTabs = () => (
    <div style={{
      display: 'flex',
      gap: '12px',
      marginBottom: '24px',
      padding: '4px',
      background: '#f1f5f9',
      borderRadius: '12px',
      width: 'fit-content'
    }}>
      {['pending', 'approved'].map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          style={{
            padding: '10px 24px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: activeTab === tab ? 700 : 500,
            color: activeTab === tab ? '#3b82f6' : '#64748b',
            background: activeTab === tab ? '#ffffff' : 'transparent',
            boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            cursor: 'pointer',
            textTransform: 'capitalize',
            transition: 'all 0.2s'
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  )

  const renderContent = () => {
    if (isLoading) return <p>Loading matches...</p>
    if (matches.length === 0) return <p>No {activeTab} matches found.</p>

    return (
      <div className="cards-grid">
        {matches.map((match) => (
          <article className="card" key={match.id} style={{ position: 'relative', overflow: 'hidden', border: '1px solid #cbd5e1', borderRadius: '16px' }}>
            <div style={{ height: '140px', backgroundImage: `url(${match.thumbnail_url || DUMMY_IMAGES[match.id % DUMMY_IMAGES.length]})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                <span className={`badge ${activeTab === 'pending' ? 'warning' : 'success'}`} style={{ textTransform: 'uppercase', fontSize: '0.7rem', background: activeTab === 'pending' ? '#f59e0b' : '#10b981', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px' }}>
                  {activeTab}
                </span>
              </div>
            </div>
            
            <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px', lineHeight: 1.3 }}>
                {match.home_team || 'Home'} <span style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 4px' }}>vs</span> {match.away_team || 'Away'}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>
                <Calendar size={14} />
                <span>{match.match_date ? formatDateTime(match.match_date) : 'TBA'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.8rem', color: '#64748b' }}>
                <MapPin size={14} style={{ marginTop: '2px' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>{match.stadium_name || 'TBA'}</span>
                  {match.stadium_address && <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{match.stadium_address}</span>}
                </div>
              </div>
            </div>

            {activeTab === 'pending' && (
              <div style={{ padding: '16px 20px', background: '#f8fafc', fontSize: '0.8rem', color: '#475569' }}>
                <p style={{ margin: '0 0 8px 0' }}><strong>Submitted by:</strong> {match.submitted_by_name || match.submitted_by_email || 'Manager'}</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button type="button" className="mc-btn mc-btn-primary" style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }} onClick={() => onApprove(match.id)}>
                    <Check size={16} />
                  </button>
                  <button type="button" className="mc-btn" style={{ flex: 1, padding: '8px', fontSize: '0.8rem', background: '#fee2e2', color: '#ef4444', borderColor: '#fee2e2' }} onClick={() => handleRejectClick(match.id)}>
                    <XCircle size={16} />
                  </button>
                  <button type="button" className="mc-btn mc-btn-ghost" style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }} onClick={() => setSelectedMatch(match)}>
                    <Eye size={16} style={{ marginRight: '6px' }} />
                    Details
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    )
  }

  return (
    <section className="container page">
      <div className="section-head" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '3rem', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '-2px', color: '#111827', lineHeight: 1 }}>Matches</h1>
          <p className="section-subtitle" style={{ fontSize: '1.1rem', color: '#6b7280', marginTop: '8px', fontWeight: 500 }}>
            Manage match approvals and active matches.
          </p>
        </div>
      </div>

      {renderTabs()}
      {renderContent()}

      {/* Match Preview Modal for Pending Tab */}
      {selectedMatch && activeTab === 'pending' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '600px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ position: 'relative', height: '220px', backgroundImage: `url(${selectedMatch.thumbnail_url || DUMMY_IMAGES[selectedMatch.id % DUMMY_IMAGES.length]})`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)' }}></div>
              <button 
                onClick={() => setSelectedMatch(null)}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s', zIndex: 10 }}
              >
                <X size={18} />
              </button>
              
              <div style={{ textAlign: 'center', color: '#fff', zIndex: 10 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.9, display: 'block', marginBottom: '8px' }}>Match Preview</span>
                <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1.1, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  {selectedMatch.home_team}
                  <span style={{ fontSize: '1.2rem', opacity: 0.8, margin: '0 12px', fontWeight: 500 }}>VS</span>
                  {selectedMatch.away_team}
                </div>
              </div>
            </div>
            
            <div style={{ padding: '30px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', marginBottom: '8px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    <Calendar size={16} /> Schedule
                  </div>
                  <div style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.1rem' }}>
                    {selectedMatch.match_date ? formatDateTime(selectedMatch.match_date) : 'TBA'}
                  </div>
                </div>
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', marginBottom: '8px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    <MapPin size={16} /> Location
                  </div>
                  <div style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.1rem' }}>
                    {selectedMatch.stadium_name || 'TBA'}
                  </div>
                  {selectedMatch.stadium_address && (
                    <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {selectedMatch.stadium_address}
                    </div>
                  )}
                </div>
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', marginBottom: '8px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    <Users size={16} /> Capacity
                  </div>
                  <div style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.1rem' }}>
                    {selectedMatch.stands ? selectedMatch.stands.reduce((acc, stand) => acc + stand.total_seats, 0).toLocaleString() : 'TBA'}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="mc-btn mc-btn-ghost" onClick={() => setSelectedMatch(null)}>
                  Close
                </button>
                <button type="button" className="mc-btn mc-btn-primary" onClick={() => {
                  onApprove(selectedMatch.id);
                  setSelectedMatch(null);
                }}>
                  <Check size={18} style={{ marginRight: '6px' }} />
                  Approve Match
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '30px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b', marginBottom: '12px' }}>Reject Match</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
              Please provide a reason for rejecting this match.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="E.g., Match date conflicts..."
              rows={4}
              style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#1e293b', marginBottom: '24px', resize: 'vertical', background: '#f8fafc', outline: 'none' }}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="mc-btn mc-btn-ghost" onClick={() => setRejectingId(null)}>
                Cancel
              </button>
              <button type="button" className="mc-btn" style={{ background: '#ef4444', color: '#fff', borderColor: '#ef4444' }} onClick={submitReject}>
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
