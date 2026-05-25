/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Check, MailOpen, CalendarCheck, ShieldX, X, Loader2 } from 'lucide-react'
import { notificationService } from '../../services/notificationService'
import { matchService } from '../../services/matchService'
import { unwrapData } from '../../utils/apiData'
import { formatDateTime } from '../../utils/formatDate'
import { APP_ROUTES } from '../../constants/routes'

export default function ManagerNotificationsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal states
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [relatedMatchData, setRelatedMatchData] = useState(null)
  const [loadingMatchData, setLoadingMatchData] = useState(false)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const response = await notificationService.getAll()
      setItems(unwrapData(response) || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const markRead = async (id, e) => {
    if (e) e.stopPropagation()
    try {
      await notificationService.markRead(id)
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)))
    } catch (error) {
      console.error('Failed to mark as read', error)
    }
  }

  const handleRowClick = async (item) => {
    setSelectedNotification(item)
    setRelatedMatchData(null)
    
    if (!item.is_read) {
      await markRead(item.id, null)
    }

    if (item.related_type === 'match' && item.related_id) {
      setLoadingMatchData(true)
      try {
        const matchRes = await matchService.getById(item.related_id)
        const matchPayload = unwrapData(matchRes)
        setRelatedMatchData(matchPayload?.data || matchPayload || null)
      } catch (e) {
        setRelatedMatchData(null)
      } finally {
        setLoadingMatchData(false)
      }
    }
  }

  const markAllRead = async () => {
    const unreadItems = items.filter(i => !i.is_read)
    for (const item of unreadItems) {
      try {
        await notificationService.markRead(item.id)
      } catch (e) {
        console.error(e)
      }
    }
    setItems((prev) => prev.map((item) => ({ ...item, is_read: true })))
  }

  const translateTitle = (title) => {
    if (!title) return '';
    let t = title;
    t = t.replace('Trận đấu của bạn đã được duyệt ✅', 'Your match has been approved ✅');
    t = t.replace('Trận đấu của bạn bị từ chối ❌', 'Your match has been rejected ❌');
    t = t.replace('Bài viết của bạn đã được duyệt ✅', 'Your article has been approved ✅');
    t = t.replace('Bài viết của bạn bị từ chối ❌', 'Your article has been rejected ❌');
    return t;
  }

  const translateBody = (body) => {
    if (!body) return 'No additional details.';
    let b = body;
    b = b.replace('Yêu cầu đã được duyệt và đã được đăng.', 'Your request has been approved and published.');
    b = b.replace('Yêu cầu bị từ chối.', 'Your request was rejected.');
    if (b.includes('Sẽ tự động đăng lúc')) {
      b = b.replace('Yêu cầu đã được duyệt. Sẽ tự động đăng lúc', 'Your request has been approved. It will be published automatically at');
    }
    return b;
  }

  const getIcon = (title) => {
    const t = translateTitle(title);
    if (t.includes('✅') || t.toLowerCase().includes('approved')) return <CalendarCheck size={18} color="#10b981" />
    if (t.includes('❌') || t.toLowerCase().includes('rejected')) return <ShieldX size={18} color="#ef4444" />
    return <Bell size={18} color="#3b82f6" />
  }

  return (
    <section className="container manager-dashboard" style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
      <div className="dashboard-header" style={{ marginBottom: '24px' }}>
        <div className="dashboard-header-left">
          <h1 className="dashboard-title">Inbox</h1>
          <p className="dashboard-subtitle">Manage your notifications and system alerts</p>
        </div>
        <div>
          <button 
            className="mc-btn mc-btn-secondary" 
            onClick={markAllRead}
            disabled={items.filter(i => !i.is_read).length === 0}
          >
            <Check size={16} style={{ marginRight: '8px' }} />
            Mark all as read
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading inbox...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            <MailOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Your inbox is empty</p>
            <p style={{ fontSize: '0.9rem' }}>You're all caught up!</p>
          </div>
        ) : (
          <div className="gmail-list">
            {items.map((item) => (
              <div 
                key={item.id} 
                className={`gmail-row ${!item.is_read ? 'unread' : 'read'}`}
                onClick={() => handleRowClick(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 24px',
                  borderBottom: '1px solid #f1f5f9',
                  background: !item.is_read ? '#f8fafc' : '#fff',
                  cursor: !item.is_read ? 'pointer' : 'default',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = !item.is_read ? '#f8fafc' : '#fff' }}
              >
                <div style={{ marginRight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: !item.is_read ? '#fff' : '#f8fafc', border: `1px solid ${!item.is_read ? '#e2e8f0' : 'transparent'}`, boxShadow: !item.is_read ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', flexShrink: 0 }}>
                  {getIcon(item.title)}
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: '1rem', 
                      fontWeight: !item.is_read ? 800 : 600, 
                      color: !item.is_read ? '#0f172a' : '#475569',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {translateTitle(item.title).replace(/[✅❌]/g, '').trim()}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: !item.is_read ? '#3b82f6' : '#94a3b8', fontWeight: !item.is_read ? 700 : 500, whiteSpace: 'nowrap', marginLeft: '16px' }}>
                      {formatDateTime(item.created_at, 'MMM dd, HH:mm')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.9rem', 
                      color: !item.is_read ? '#334155' : '#64748b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontWeight: !item.is_read ? 500 : 400
                    }}>
                      {translateBody(item.body)}
                    </p>
                    
                    {!item.is_read && (
                      <button 
                        className="mc-btn mc-btn-ghost" 
                        style={{ padding: '4px 8px', fontSize: '0.75rem', minHeight: 'auto', background: '#e0e7ff', color: '#4f46e5', marginLeft: '16px' }}
                        onClick={(e) => markRead(item.id, e)}
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedNotification && (
        <div className="modal-overlay" onClick={() => setSelectedNotification(null)}>
          <div className="modal-content" style={{ maxWidth: '600px', padding: '30px', animation: 'slideUp 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                  {getIcon(selectedNotification.title)}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>{translateTitle(selectedNotification.title).replace(/[✅❌]/g, '').trim()}</h2>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                    {formatDateTime(selectedNotification.created_at, 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
              </div>
              <button className="mc-btn mc-btn-ghost" style={{ padding: '8px', minHeight: 'auto' }} onClick={() => setSelectedNotification(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155', lineHeight: '1.6' }}>
                {translateBody(selectedNotification.body)}
              </p>
            </div>

            {selectedNotification.related_type === 'match' && (
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>Related Match Details</h3>
                {loadingMatchData ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem', padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <Loader2 size={16} className="lucide-spin" /> Loading match info...
                  </div>
                ) : relatedMatchData ? (
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>MATCHUP</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
                          {relatedMatchData.home_team} <span style={{ color: '#94a3b8', fontWeight: 400, margin: '0 4px' }}>vs</span> {relatedMatchData.away_team}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>APPROVAL STATUS</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', display: 'inline-block',
                          background: relatedMatchData.status === 'published' ? '#dcfce7' : relatedMatchData.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                          color: relatedMatchData.status === 'published' ? '#166534' : relatedMatchData.status === 'rejected' ? '#991b1b' : '#b45309'
                        }}>
                          {relatedMatchData.status.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>MATCH DATE</div>
                        <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>{formatDateTime(relatedMatchData.match_date, 'MMM dd, yyyy HH:mm')}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>VENUE</div>
                        <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>{relatedMatchData.stadium_name || 'N/A'}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                      <Link 
                        to={APP_ROUTES.MANAGER_MATCH_EDIT.replace(':matchId', relatedMatchData.id)} 
                        className="mc-btn mc-btn-primary"
                        style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                      >
                        View Match Detail
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '16px', background: '#fee2e2', color: '#ef4444', fontSize: '0.9rem', borderRadius: '12px', border: '1px solid #fecaca' }}>
                    Could not load match details. It may have been deleted.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
