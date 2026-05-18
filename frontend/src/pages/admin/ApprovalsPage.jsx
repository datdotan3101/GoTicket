import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Eye, MapPin, Calendar, Clock, X, Check, XCircle, Users, ShoppingCart } from 'lucide-react'
import { approvalsService } from '../../services/approvalsService'
import { unwrapData } from '../../utils/apiData'
import { formatDateTime, formatVND } from '../../common/formatters'

const DUMMY_IMAGES = [
  'https://images.unsplash.com/photo-1518605368461-1ee0676644ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1540747913346-19e32fc3e6ed?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1508344928928-7137b29de218?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
]

export default function ApprovalsPage() {
  const [type, setType] = useState('')
  const [items, setItems] = useState([])
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')


  useEffect(() => {
    const fetchPending = async () => {
      try {
        const response = await approvalsService.getPending(type ? { type } : undefined)
        setItems(unwrapData(response) || [])
      } catch {
        setItems([])
      }
    }

    fetchPending()
  }, [type])

  const refresh = async () => {
    try {
      const response = await approvalsService.getPending(type ? { type } : undefined)
      setItems(unwrapData(response) || [])
    } catch {
      setItems([])
    }
  }

  const onApprove = async (id) => {
    try {
      await approvalsService.approve(id)
      toast.success('Approved.')
      refresh()
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
      toast.success('Rejected.')
      refresh()
      window.dispatchEvent(new CustomEvent('approval-updated'))
      setRejectingId(null)
      // If rejecting the currently selected match in the detail modal, close it
      if (selectedMatch && selectedMatch.id === rejectingId) {
        setSelectedMatch(null)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Reject failed.')
    }
  }

  return (
    <section className="container page">
      <h1>Approvals</h1>
      <div className="form">
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="">All</option>
          <option value="match">match</option>
          <option value="news">news</option>
          <option value="user_account">user_account</option>
        </select>
      </div>
      <div className="cards-grid">
        {items.map((item) => (
          <article className="card" key={item.id} style={{ position: 'relative', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
            {item.resource_type === 'match' && (
              <div style={{ height: '140px', backgroundImage: `url(${item.thumbnail_url || DUMMY_IMAGES[item.id % DUMMY_IMAGES.length]})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                  <span className="badge warning" style={{ textTransform: 'uppercase', fontSize: '0.7rem', background: '#f59e0b', color: '#fff', border: 'none' }}>
                    {item.resource_type}
                  </span>
                </div>
              </div>
            )}
            <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
              {item.resource_type !== 'match' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className="badge warning" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                    {item.resource_type}
                  </span>
                </div>
              )}
              
              {item.resource_type === 'match' ? (
                <>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px', lineHeight: 1.3 }}>
                    {item.home_team || 'Home'} <span style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 4px' }}>vs</span> {item.away_team || 'Away'}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>
                    <Calendar size={14} />
                    <span>{item.match_date ? formatDateTime(item.match_date) : 'TBA'}</span>
                  </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.8rem', color: '#64748b' }}>
                      <MapPin size={14} style={{ marginTop: '2px' }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{item.stadium_name || 'TBA'}</span>
                        {item.stadium_address && <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{item.stadium_address}</span>}
                      </div>
                    </div>
                    {item.ticket_sale_open_at && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#f97316', marginTop: '10px', fontWeight: 700, background: '#fff7ed', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ffedd5', width: 'fit-content' }}>
                        <span style={{ fontSize: '10px' }}>🛒</span>
                        <span>SALE OPENS: {formatDateTime(item.ticket_sale_open_at)}</span>
                      </div>
                    )}
                  </>
              ) : (
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
                  Request #{item.id}
                </h3>
              )}
            </div>

            <div style={{ padding: '16px 20px', background: '#f8fafc', fontSize: '0.8rem', color: '#475569' }}>
              <p style={{ margin: '0 0 8px 0' }}><strong>Submitted by:</strong> {item.submitted_by_name || item.submitted_by_email}</p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button type="button" className="mc-btn mc-btn-primary" style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }} onClick={() => onApprove(item.id)}>
                  <Check size={16} />
                </button>
                <button type="button" className="mc-btn" style={{ flex: 1, padding: '8px', fontSize: '0.8rem', background: '#fee2e2', color: '#ef4444', borderColor: '#fee2e2' }} onClick={() => handleRejectClick(item.id)}>
                  <XCircle size={16} />
                </button>
                {item.resource_type === 'match' && (
                  <button type="button" className="mc-btn mc-btn-ghost" style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }} onClick={() => setSelectedMatch(item)}>
                    <Eye size={16} style={{ marginRight: '6px' }} />
                    Details
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {selectedMatch && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column' }}>
            {/* Header Banner - Keeping it simple at top */}
            <div style={{ position: 'relative', height: '120px', backgroundImage: `url(${selectedMatch.thumbnail_url || DUMMY_IMAGES[selectedMatch.id % DUMMY_IMAGES.length]})`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
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

      {rejectingId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '30px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b', marginBottom: '12px' }}>Reject Request</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
              Please provide a reason for rejecting this request. The submitter will receive a notification with this feedback.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="E.g., Match date conflicts with an existing event..."
              rows={4}
              style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#1e293b', marginBottom: '24px', resize: 'vertical', background: '#f8fafc', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => e.target.style.borderColor = '#ef4444'}
              onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
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
