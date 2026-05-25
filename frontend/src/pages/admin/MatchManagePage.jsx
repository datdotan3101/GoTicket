/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react'
import { matchService } from '../../services/matchService'
import { approvalsService } from '../../services/approvalsService'
import { unwrapData } from '../../utils/apiData'
import { formatDateTime, formatVND } from '../../common/formatters'
import toast from 'react-hot-toast'
import { Eye, MapPin, Calendar, Clock, X, Check, XCircle, Users, ShoppingCart } from 'lucide-react'
import { usePagination } from '../../hooks/usePagination'
import Pagination from '../../components/ui/Pagination'

const DUMMY_IMAGES = [
  'https://images.unsplash.com/photo-1518605368461-1ee0676644ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1540747913346-19e32fc3e6ed?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1508344928928-7137b29de218?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
]

const getFallbackImage = (id) => {
  if (!id) return DUMMY_IMAGES[0]
  if (typeof id === 'number') return DUMMY_IMAGES[Math.abs(id) % DUMMY_IMAGES.length]
  const sum = String(id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return DUMMY_IMAGES[sum % DUMMY_IMAGES.length]
}

export default function MatchManagePage() {
  const [activeTab, setActiveTab] = useState('pending') // pending, approved
  const [matches, setMatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Modals for pending approval
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const {
    currentPage,
    setCurrentPage,
    paginatedItems,
    totalPages
  } = usePagination(matches, 6, activeTab)

  const fetchMatches = async () => {
    setIsLoading(true)
    try {
      if (activeTab === 'pending') {
        const response = await approvalsService.getPending({ type: 'match' })
        const dataList = unwrapData(response) || []
        dataList.sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime())
        setMatches(dataList)
      } else if (activeTab === 'approved') {
        const response = await matchService.getAll({ status: 'published,approved', limit: 100 })
        const payload = unwrapData(response)
        const dataList = payload?.data ?? payload ?? []
        dataList.sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime())
        setMatches(dataList)
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
      window.dispatchEvent(new CustomEvent('approval-updated'))
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
      window.dispatchEvent(new CustomEvent('approval-updated'))
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
      <>
        <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {paginatedItems.map((match) => (
            <article className="card" key={match.id} style={{ position: 'relative', overflow: 'hidden', border: '1px solid #cbd5e1', borderRadius: '16px', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ height: '160px', backgroundImage: `url(${match.thumbnail_url || getFallbackImage(match.id)})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', backgroundColor: '#e2e8f0', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                <span className={`badge ${activeTab === 'pending' ? 'warning' : 'success'}`} style={{ textTransform: 'uppercase', fontSize: '0.7rem', background: activeTab === 'pending' ? '#f59e0b' : '#10b981', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px' }}>
                  {activeTab}
                </span>
              </div>
            </div>
              
            <div style={{ padding: '20px', borderBottom: activeTab === 'pending' ? '1px solid #f1f5f9' : 'none', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px', lineHeight: 1.3 }}>
                {match.home_team || 'Home'} <span style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 4px' }}>vs</span> {match.away_team || 'Away'}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748b', marginBottom: '8px', marginTop: 'auto' }}>
                <Calendar size={14} style={{ flexShrink: 0 }} />
                <span>{match.match_date ? formatDateTime(match.match_date) : 'TBA'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.8rem', color: '#64748b' }}>
                <MapPin size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.stadium_name || 'TBA'}</span>
                  {match.stadium_address && <span style={{ fontSize: '0.7rem', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.stadium_address}</span>}
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
        {totalPages > 1 && (
          <div style={{ marginTop: '32px' }}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </>
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
          <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column' }}>
            {/* Header Banner - Keeping it simple at top */}
            <div style={{ position: 'relative', height: '120px', backgroundImage: `url(${selectedMatch.thumbnail_url || getFallbackImage(selectedMatch.id)})`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.8) 100%)' }}></div>
              <button 
                onClick={() => setSelectedMatch(null)}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
              >
                <X size={18} />
              </button>
              <div style={{ textAlign: 'center', color: '#fff', zIndex: 10 }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  {selectedMatch.home_team} vs {selectedMatch.away_team}
                </h2>
              </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Left Column: Match Details */}
              <div style={{ width: '40%', padding: '30px', borderRight: '1px solid #e2e8f0', background: '#f8fafc', overflowY: 'auto' }}>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>Quick Info</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <Calendar size={18} color="#3b82f6" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>SCHEDULE</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{selectedMatch.match_date ? formatDateTime(selectedMatch.match_date) : 'TBA'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <MapPin size={18} color="#ef4444" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>LOCATION</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{selectedMatch.stadium_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{selectedMatch.stadium_address}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <Users size={18} color="#10b981" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>TOTAL CAPACITY</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                          {selectedMatch.stands ? selectedMatch.stands.reduce((acc, stand) => acc + stand.total_seats, 0).toLocaleString() : '0'} Seats
                        </div>
                      </div>
                    </div>
                    {selectedMatch.ticket_sale_open_at && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #ffedd5' }}>
                          <ShoppingCart size={18} color="#f97316" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#f97316', fontWeight: 600 }}>TICKET SALE OPENS</div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f97316' }}>{formatDateTime(selectedMatch.ticket_sale_open_at)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>Submitted By</div>
                  <div style={{ background: '#fff', padding: '16px', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{selectedMatch.submitted_by_name}</div>
                    <div style={{ color: '#3b82f6', fontSize: '0.8rem', fontWeight: 600 }}>{selectedMatch.club_name || 'Individual Manager'}</div>
                    <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#94a3b8' }}>
                      Submitted on {new Date(selectedMatch.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Pricing List */}
              <div style={{ width: '60%', padding: '30px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Ticket Pricing & Stands</div>
                  <span className="badge primary" style={{ fontSize: '0.7rem' }}>{selectedMatch.stands?.length || 0} Zones</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {Object.entries(
                    (selectedMatch.stands || []).reduce((groups, stand) => {
                      const prefix = stand.name.charAt(0).toUpperCase();
                      const groupName = stand.name === 'VIP' ? 'VIP' : `Stand ${prefix}`;
                      if (!groups[groupName]) groups[groupName] = [];
                      groups[groupName].push(stand);
                      return groups;
                    }, {})
                  ).map(([groupName, stands], groupIdx) => (
                    <div key={groupIdx}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#1e293b', background: '#f1f5f9', padding: '6px 12px', borderRadius: '6px', marginBottom: '10px', display: 'inline-block' }}>
                        {groupName}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {stands.map((stand, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '6px', height: '6px', borderRadius: '3px', background: stand.name === 'VIP' ? '#f59e0b' : '#3b82f6' }}></div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                                {stand.name}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
                                {stand.total_seats.toLocaleString()} seats
                              </div>
                              <div style={{ fontSize: '1rem', fontWeight: 900, color: '#10b981', minWidth: '90px', textAlign: 'right' }}>
                                {formatVND(stand.price)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div style={{ padding: '20px 30px', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="mc-btn mc-btn-ghost" onClick={() => setSelectedMatch(null)}>
                Close Preview
              </button>
              <button type="button" className="mc-btn mc-btn-primary" style={{ padding: '10px 24px' }} onClick={() => {
                onApprove(selectedMatch.id);
                setSelectedMatch(null);
              }}>
                <Check size={18} style={{ marginRight: '8px' }} />
                Approve This Match
              </button>
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
