import { useState, useEffect, useRef } from 'react'
import { messageService } from '../../services/messageService'
import { userService } from '../../services/userService'
import { unwrapData } from '../../utils/apiData'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'react-toastify'
import { Mail, Send, Clock, Star, Square, ArrowLeft, RefreshCw, MoreVertical, CheckSquare, MinusSquare, Trash2, MailOpen, Search } from 'lucide-react'

export default function MailboxPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('inbox') // inbox, starred, drafts, sent, compose
  const [messages, setMessages] = useState([])
  const [recipients, setRecipients] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ receiverId: '', subject: '', body: '' })
  const [selectedMsg, setSelectedMsg] = useState(null)
  
  // Toolbar states
  const [filter, setFilter] = useState('all') // all, read, unread, starred, unstarred
  const [showKebab, setShowKebab] = useState(false)
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [recipientSearch, setRecipientSearch] = useState('')
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const toolbarRef = useRef(null)
  const recipientDropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target)) {
        setShowKebab(false)
        setShowFilterMenu(false)
      }
      if (recipientDropdownRef.current && !recipientDropdownRef.current.contains(event.target)) {
        setShowRecipientDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setSelectedMsg(null)
    setFilter('all')
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'inbox') {
        const res = await messageService.getInbox()
        setMessages(unwrapData(res) || [])
      } else if (activeTab === 'sent') {
        const res = await messageService.getSent()
        setMessages(unwrapData(res) || [])
      } else if (activeTab === 'drafts') {
        const res = await messageService.getDrafts()
        setMessages(unwrapData(res) || [])
      } else if (activeTab === 'starred') {
        const res = await messageService.getStarred()
        setMessages(unwrapData(res) || [])
      } else if (activeTab === 'compose') {
        const res = await messageService.getRecipients()
        setRecipients(unwrapData(res) || [])
      }
    } catch (err) {
      console.error('fetchData error:', err)
      toast.error('Failed to load data: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e, isDraft = false) => {
    if (e) e.preventDefault()
    if (!form.receiverId || !form.subject || !form.body) {
      toast.error('Please fill in all fields')
      return
    }
    
    try {
      await messageService.sendMessage({ ...form, is_draft: isDraft })
      toast.success(isDraft ? 'Draft saved!' : 'Message sent successfully!')
      setForm({ receiverId: '', subject: '', body: '' })
      if (!isDraft) window.dispatchEvent(new Event('message-sent'))
      setActiveTab(isDraft ? 'drafts' : 'sent')
    } catch (err) {
      toast.error('Failed to send message')
    }
  }

  const handleMarkAsRead = async (e, id) => {
    if (e) e.stopPropagation()
    try {
      await messageService.markAsRead(id)
      setMessages(messages.map(m => m.id === id ? { ...m, is_read: true } : m))
      window.dispatchEvent(new Event('message-read'))
    } catch (err) {
      toast.error('Failed to mark as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    setShowKebab(false)
    try {
      await messageService.markAllAsRead()
      setMessages(messages.map(m => ({ ...m, is_read: true })))
      window.dispatchEvent(new Event('message-read'))
      toast.success('All messages marked as read')
    } catch (err) {
      toast.error('Failed to mark all as read')
    }
  }

  const handleToggleStar = async (e, id) => {
    e.stopPropagation()
    try {
      await messageService.toggleStar(id)
      if (activeTab === 'starred') {
        setMessages(messages.filter(m => m.id !== id)) // remove from view if unstarred
      } else {
        setMessages(messages.map(m => m.id === id ? { ...m, is_starred: !m.is_starred } : m))
      }
    } catch (err) {
      toast.error('Failed to toggle star')
    }
  }

  const handleReply = (msg) => {
    setForm({
      receiverId: msg.sender_id,
      subject: msg.subject.startsWith('Re:') ? msg.subject : `Re: ${msg.subject}`,
      body: `\n\n--- Replying to ${msg.sender_name} ---\n${msg.body}`
    })
    setActiveTab('compose')
  }

  const handleMsgClick = (msg) => {
    if (activeTab === 'drafts') {
      setForm({
        receiverId: msg.receiver_id || '',
        subject: msg.subject || '',
        body: msg.body || ''
      })
      setActiveTab('compose')
      return
    }

    setSelectedMsg(msg)
    if (activeTab === 'inbox' && !msg.is_read) {
       handleMarkAsRead(null, msg.id)
       setSelectedMsg({ ...msg, is_read: true })
    }
  }

  const handleToggleSelect = (e, id) => {
    e.stopPropagation()
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleSelectAll = () => {
    if (selectedIds.length === filteredMessages.length && filteredMessages.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredMessages.map(m => m.id))
    }
  }

  const handleMarkSelectedAsRead = async () => {
    try {
      await Promise.all(selectedIds.map(id => messageService.markAsRead(id)))
      setMessages(messages.map(m => selectedIds.includes(m.id) ? { ...m, is_read: true } : m))
      setSelectedIds([])
      window.dispatchEvent(new Event('message-read'))
      toast.success('Selected messages marked as read')
    } catch (err) {
      toast.error('Failed to mark messages as read')
    }
  }

  const handleDeleteSelected = () => {
    // For now, simply remove from local view since there isn't a delete API
    setMessages(messages.filter(m => !selectedIds.includes(m.id)))
    setSelectedIds([])
    toast.success('Selected messages deleted')
  }

  const filteredMessages = messages.filter(msg => {
    if (filter === 'read' && !msg.is_read) return false
    if (filter === 'unread' && msg.is_read) return false
    if (filter === 'starred' && !msg.is_starred) return false
    if (filter === 'unstarred' && msg.is_starred) return false

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const match = 
        (msg.sender_name && msg.sender_name.toLowerCase().includes(q)) ||
        (msg.sender_email && msg.sender_email.toLowerCase().includes(q)) ||
        (msg.receiver_name && msg.receiver_name.toLowerCase().includes(q)) ||
        (msg.receiver_email && msg.receiver_email.toLowerCase().includes(q)) ||
        (msg.subject && msg.subject.toLowerCase().includes(q)) ||
        (msg.body && msg.body.toLowerCase().includes(q))
      if (!match) return false
    }

    if (dateFrom || dateTo) {
      const msgDate = new Date(msg.created_at)
      if (dateFrom && msgDate < new Date(dateFrom)) return false
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        if (msgDate > toDate) return false
      }
    }

    return true
  })

  return (
    <section className="container page" style={{ padding: '40px 20px', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Mail size={32} color="#f97316" />
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>Mailbox</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px' }}>
            <Search size={16} color="#94a3b8" style={{ marginRight: '8px' }} />
            <input 
              type="text" 
              placeholder="Search name, email, subject..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9rem', width: '220px' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>From:</span>
            <input 
              type="date" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{ padding: '6px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>To:</span>
            <input 
              type="date" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{ padding: '6px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569', outline: 'none' }}
            />
          </div>
        </div>
      </div>

      {activeTab !== 'compose' && !selectedMsg && (
        <div ref={toolbarRef} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '24px' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button 
                onClick={handleSelectAll} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: selectedIds.length > 0 ? '#f97316' : '#64748b', display: 'flex', padding: '0 4px 0 0' }}
              >
                {selectedIds.length > 0 && selectedIds.length < filteredMessages.length ? <MinusSquare size={18} /> : selectedIds.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
              </button>
              <button 
                onClick={() => { setShowFilterMenu(!showFilterMenu); setShowKebab(false); }} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: '0 4px' }}
              >
                <span style={{ fontSize: '0.8rem' }}>▼</span>
              </button>
            </div>
            {showFilterMenu && (
              <div style={{ position: 'absolute', top: '100%', left: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, padding: '8px 0', minWidth: '120px' }}>
                {['all', 'read', 'unread', 'starred', 'unstarred'].map(f => (
                  <div 
                    key={f} 
                    onClick={() => { setFilter(f); setShowFilterMenu(false) }}
                    style={{ padding: '8px 16px', cursor: 'pointer', textTransform: 'capitalize', fontSize: '0.9rem', background: filter === f ? '#f1f5f9' : 'transparent', color: '#1e293b' }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={(e) => e.currentTarget.style.background = filter === f ? '#f1f5f9' : 'transparent'}
                  >
                    {f}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {selectedIds.length > 0 ? (
            <>
              <button onClick={handleDeleteSelected} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }} title="Delete">
                <Trash2 size={18} />
              </button>
              <button onClick={handleMarkSelectedAsRead} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }} title="Mark as read">
                <MailOpen size={18} />
              </button>
              <div style={{ flex: 1 }}></div>
              <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>{selectedIds.length} selected</span>
            </>
          ) : (
            <>
              <button onClick={fetchData} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }} title="Refresh">
                <RefreshCw size={18} />
              </button>
              <div style={{ position: 'relative' }}>
                <button onClick={() => { setShowKebab(!showKebab); setShowFilterMenu(false); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                  <MoreVertical size={18} />
                </button>
                {showKebab && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, padding: '8px 0', minWidth: '150px' }}>
                    <div 
                      onClick={handleMarkAllAsRead}
                      style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '0.9rem', color: '#1e293b' }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      Mark all as read
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', overflowX: 'auto' }}>
        {['inbox', 'starred', 'drafts', 'sent'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ padding: '8px 16px', background: activeTab === tab ? '#f97316' : 'transparent', color: activeTab === tab ? '#fff' : '#64748b', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', whiteSpace: 'nowrap' }}
          >
            {tab}
          </button>
        ))}
        <button 
          onClick={() => setActiveTab('compose')}
          style={{ padding: '8px 16px', background: activeTab === 'compose' ? '#10b981' : 'transparent', color: activeTab === 'compose' ? '#fff' : '#64748b', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto', whiteSpace: 'nowrap' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Send size={16} /> Compose
          </div>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading messages...</div>
      ) : activeTab === 'compose' ? (
        <form onSubmit={(e) => handleSend(e, false)} style={{ background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }} ref={recipientDropdownRef}>
              <label style={{ fontWeight: 600, color: '#475569' }}>To</label>
              <div 
                onClick={() => setShowRecipientDropdown(true)}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'text', minHeight: '46px', display: 'flex', alignItems: 'center', background: '#fff' }}
              >
                {showRecipientDropdown ? (
                  <input 
                    autoFocus
                    value={recipientSearch}
                    onChange={(e) => setRecipientSearch(e.target.value)}
                    placeholder="Type to search..."
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '1rem' }}
                  />
                ) : (
                  <span style={{ color: form.receiverId ? '#0f172a' : '#94a3b8' }}>
                    {form.receiverId 
                      ? (() => { const r = recipients.find(x => x.id === form.receiverId); return r ? `${r.full_name} (${r.email})` : 'Unknown'; })() 
                      : 'Select recipient...'}
                  </span>
                )}
              </div>
              
              {showRecipientDropdown && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {recipients.filter(r => (r.full_name + ' ' + r.email).toLowerCase().includes(recipientSearch.toLowerCase())).map(r => (
                    <div 
                      key={r.id}
                      onClick={() => {
                        setForm({...form, receiverId: r.id});
                        setShowRecipientDropdown(false);
                        setRecipientSearch('');
                      }}
                      style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {r.full_name} <span style={{ color: '#64748b', fontSize: '0.9em' }}>({r.email})</span>
                    </div>
                  ))}
                  {recipients.filter(r => (r.full_name + ' ' + r.email).toLowerCase().includes(recipientSearch.toLowerCase())).length === 0 && (
                    <div style={{ padding: '10px 12px', color: '#94a3b8', textAlign: 'center' }}>No recipients found</div>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: 600, color: '#475569' }}>Subject</label>
              <input 
                type="text" 
                placeholder="Enter subject"
                value={form.subject}
                onChange={e => setForm({...form, subject: e.target.value})}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: 600, color: '#475569' }}>Message</label>
              <textarea 
                placeholder="Type your message here..."
                rows={6}
                value={form.body}
                onChange={e => setForm({...form, body: e.target.value})}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button type="submit" style={{ padding: '14px 24px', background: '#f97316', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                Send Message
              </button>
              <button type="button" onClick={() => handleSend(null, true)} style={{ padding: '14px 24px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                Save Draft
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Action Toolbar moved up */}

          {filteredMessages.length === 0 && !selectedMsg ? (
            <div style={{ padding: '60px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
              No messages found.
            </div>
          ) : selectedMsg ? (
            <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <button 
                  onClick={() => setSelectedMsg(null)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b', padding: '8px', borderRadius: '50%', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  title="Back to list"
                >
                  <ArrowLeft size={20} />
                </button>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>{selectedMsg.subject}</h2>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f97316', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {(activeTab === 'inbox' ? selectedMsg.sender_name : selectedMsg.receiver_name)?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>
                      {activeTab === 'inbox' ? selectedMsg.sender_name : selectedMsg.receiver_name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {activeTab === 'inbox' ? `from: ${selectedMsg.sender_email}` : `to: ${selectedMsg.receiver_email}`}
                    </div>
                  </div>
                </div>
                <div style={{ color: '#64748b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span>{new Date(selectedMsg.created_at).toLocaleString()}</span>
                  {activeTab === 'inbox' && (
                    <button 
                      onClick={() => handleReply(selectedMsg)}
                      style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontWeight: 600 }}
                    >
                      <Send size={14} /> Reply
                    </button>
                  )}
                </div>
              </div>
              <div style={{ color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
                {selectedMsg.body}
              </div>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: '0 0 12px 12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              {filteredMessages.map((msg) => {
                const isRead = msg.is_read || activeTab === 'sent' || activeTab === 'drafts'
                return (
                  <div 
                    key={msg.id} 
                    onClick={() => handleMsgClick(msg)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '12px 16px', 
                      borderBottom: '1px solid #e2e8f0',
                      background: isRead ? '#f8fafc' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      color: isRead ? '#475569' : '#0f172a'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.boxShadow = 'inset 1px 0 0 #dadce0, inset -1px 0 0 #dadce0, 0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)'
                      e.currentTarget.style.zIndex = '1'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.zIndex = '0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: '16px', color: '#94a3b8' }}>
                      {selectedIds.includes(msg.id) ? (
                        <CheckSquare 
                          size={18} 
                          strokeWidth={1.5} 
                          color="#f97316"
                          onClick={(e) => handleToggleSelect(e, msg.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      ) : (
                        <Square 
                          size={18} 
                          strokeWidth={1.5} 
                          onClick={(e) => handleToggleSelect(e, msg.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      )}
                      <Star 
                        size={18} 
                        strokeWidth={1.5} 
                        fill={msg.is_starred ? '#facc15' : 'transparent'} 
                        color={msg.is_starred ? '#facc15' : '#94a3b8'}
                        onClick={(e) => handleToggleStar(e, msg.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                    <div style={{ 
                      width: '200px', 
                      minWidth: '200px',
                      fontWeight: isRead ? 400 : 800,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: isRead ? '#475569' : '#000000'
                    }}>
                      {activeTab === 'inbox' ? msg.sender_name : msg.receiver_name || 'Draft'}
                    </div>
                    <div style={{ 
                      flex: 1, 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      gap: '8px'
                    }}>
                      <span style={{ fontWeight: isRead ? 400 : 800, color: isRead ? '#475569' : '#000000' }}>{msg.subject || '(No subject)'}</span>
                      <span style={{ color: '#94a3b8' }}>-</span>
                      <span style={{ color: '#64748b' }}>{msg.body.replace(/\n/g, ' ')}</span>
                    </div>
                    <div style={{ 
                      width: '100px', 
                      textAlign: 'right', 
                      fontSize: '0.8rem',
                      fontWeight: isRead ? 400 : 700,
                      color: isRead ? '#64748b' : '#0f172a'
                    }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
