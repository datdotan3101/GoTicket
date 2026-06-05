import { useState, useEffect, useRef } from 'react'
import { messageService } from '../../services/messageService'
import { userService } from '../../services/userService'
import { unwrapData } from '../../utils/apiData'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'react-toastify'
import { Mail, Send, Clock, Star, Square, ArrowLeft, RefreshCw, MoreVertical, CheckSquare, MinusSquare, Trash2, MailOpen, Search } from 'lucide-react'

export default function MailboxPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('inbox')
  const [messages, setMessages] = useState([])
  const [recipients, setRecipients] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ receiverId: '', subject: '', body: '' })
  
  const [selectedThreadId, setSelectedThreadId] = useState(null)
  const [replyBody, setReplyBody] = useState('')
  
  const [filter, setFilter] = useState('all')
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
    setSelectedThreadId(null)
    setSelectedIds([])
    setFilter('all')
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (['inbox', 'sent', 'starred'].includes(activeTab)) {
        const [inboxRes, sentRes] = await Promise.all([
          messageService.getInbox().catch(() => ({})),
          messageService.getSent().catch(() => ({}))
        ])
        const inboxData = unwrapData(inboxRes) || []
        const sentData = unwrapData(sentRes) || []
        const allMsgs = [...inboxData, ...sentData]
        
        const uniqueMap = new Map()
        allMsgs.forEach(m => uniqueMap.set(m.id, m))
        setMessages(Array.from(uniqueMap.values()))
      } else if (activeTab === 'drafts') {
        const res = await messageService.getDrafts()
        setMessages(unwrapData(res) || [])
      } else if (activeTab === 'compose') {
        const res = await messageService.getRecipients()
        setRecipients(unwrapData(res) || [])
      }
    } catch (err) {
      toast.error('Failed to load data')
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

  const threadsMap = new Map()
  if (['inbox', 'sent', 'starred'].includes(activeTab)) {
    messages.forEach(msg => {
      const isSentByMe = msg.sender_id === user?.id
      const otherId = isSentByMe ? msg.receiver_id : msg.sender_id
      const otherName = isSentByMe ? msg.receiver_name : msg.sender_name
      
      const normalizedSubject = (msg.subject || '').replace(/^(Re:\s*)+/gi, '').trim()
      const threadKey = `${normalizedSubject}_${otherId}`
      
      if (!threadsMap.has(threadKey)) {
        threadsMap.set(threadKey, {
          id: threadKey,
          messages: [],
          latestDate: 0,
          subject: normalizedSubject || '(No subject)',
          otherParticipantId: otherId,
          otherParticipantName: otherName,
          hasInbox: false,
          hasSent: false,
          is_starred: false,
          is_read: true,
          latestMsg: null
        })
      }
      
      const thread = threadsMap.get(threadKey)
      thread.messages.push(msg)
      
      const msgTime = new Date(msg.created_at).getTime()
      if (msgTime > thread.latestDate) {
        thread.latestDate = msgTime
        thread.latestMsg = msg
      }
      
      if (msg.receiver_id === user?.id) {
        thread.hasInbox = true
        if (!msg.is_read) thread.is_read = false
      }
      if (msg.sender_id === user?.id) {
        thread.hasSent = true
      }
      if (msg.is_starred) {
        thread.is_starred = true
      }
    })
    
    threadsMap.forEach(t => t.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()))
  }

  let listItems = []
  if (activeTab === 'drafts') {
    listItems = messages.filter(msg => {
      if (filter === 'read' && !msg.is_read) return false
      if (filter === 'unread' && msg.is_read) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const match = (msg.receiver_name && msg.receiver_name.toLowerCase().includes(q)) ||
                      (msg.subject && msg.subject.toLowerCase().includes(q)) ||
                      (msg.body && msg.body.toLowerCase().includes(q))
        if (!match) return false
      }
      return true
    })
  } else {
    const allThreads = Array.from(threadsMap.values()).sort((a, b) => b.latestDate - a.latestDate)
    listItems = allThreads.filter(thread => {
      if (activeTab === 'inbox' && !thread.hasInbox) return false
      if (activeTab === 'sent' && !thread.hasSent) return false
      if (activeTab === 'starred' && !thread.is_starred) return false
      
      if (filter === 'read' && !thread.is_read) return false
      if (filter === 'unread' && thread.is_read) return false
      if (filter === 'starred' && !thread.is_starred) return false
      if (filter === 'unstarred' && thread.is_starred) return false

      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const match = thread.messages.some(msg => 
          (msg.sender_name && msg.sender_name.toLowerCase().includes(q)) ||
          (msg.receiver_name && msg.receiver_name.toLowerCase().includes(q)) ||
          (msg.subject && msg.subject.toLowerCase().includes(q)) ||
          (msg.body && msg.body.toLowerCase().includes(q))
        )
        if (!match) return false
      }
      
      if (dateFrom || dateTo) {
        if (dateFrom && thread.latestDate < new Date(dateFrom).getTime()) return false
        if (dateTo) {
          const toD = new Date(dateTo)
          toD.setHours(23, 59, 59, 999)
          if (thread.latestDate > toD.getTime()) return false
        }
      }
      return true
    })
  }

  const handleThreadClick = (thread) => {
    setSelectedThreadId(thread.id)
    setReplyBody('')
    
    const unreadMsgs = thread.messages.filter(m => !m.is_read && m.receiver_id === user?.id)
    if (unreadMsgs.length > 0) {
      Promise.all(unreadMsgs.map(m => messageService.markAsRead(m.id))).then(() => {
        window.dispatchEvent(new Event('message-read'))
        fetchData()
      })
    }
  }

  const handleDraftClick = (msg) => {
    setForm({
      receiverId: msg.receiver_id || '',
      subject: msg.subject || '',
      body: msg.body || ''
    })
    setActiveTab('compose')
  }

  const handleInlineReply = async (thread) => {
    if (!replyBody.trim()) {
      toast.error('Reply cannot be empty')
      return
    }
    try {
      const subject = thread.subject.startsWith('Re:') ? thread.subject : `Re: ${thread.subject}`
      await messageService.sendMessage({
        receiverId: thread.otherParticipantId,
        subject: subject,
        body: replyBody.trim(),
        is_draft: false
      })
      toast.success('Reply sent!')
      setReplyBody('')
      window.dispatchEvent(new Event('message-sent'))
      fetchData()
    } catch (err) {
      toast.error('Failed to send reply')
    }
  }

  const handleToggleSelect = (e, id) => {
    e.stopPropagation()
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleSelectAll = () => {
    if (selectedIds.length === listItems.length && listItems.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(listItems.map(item => item.id))
    }
  }

  const handleMarkSelectedAsRead = async () => {
    try {
      if (activeTab === 'drafts') {
        await Promise.all(selectedIds.map(id => messageService.markAsRead(id)))
      } else {
        const unreadMsgs = []
        selectedIds.forEach(tId => {
          const t = threadsMap.get(tId)
          if (t) {
            t.messages.forEach(m => {
              if (!m.is_read && m.receiver_id === user?.id) unreadMsgs.push(m.id)
            })
          }
        })
        await Promise.all(unreadMsgs.map(id => messageService.markAsRead(id)))
      }
      setSelectedIds([])
      window.dispatchEvent(new Event('message-read'))
      fetchData()
      toast.success('Selected marked as read')
    } catch (err) {
      toast.error('Action failed')
    }
  }

  const handleMarkAllAsRead = async () => {
    setShowKebab(false)
    try {
      await messageService.markAllAsRead()
      window.dispatchEvent(new Event('message-read'))
      fetchData()
      toast.success('All messages marked as read')
    } catch (err) {
      toast.error('Failed to mark all as read')
    }
  }

  const handleDeleteSelected = async () => {
    try {
      if (activeTab === 'drafts') {
        await Promise.all(selectedIds.map(id => messageService.deleteMessage(id)))
      } else {
        const msgsToRemove = new Set()
        selectedIds.forEach(tId => {
          const t = threadsMap.get(tId)
          if (t) t.messages.forEach(m => msgsToRemove.add(m.id))
        })
        await Promise.all(Array.from(msgsToRemove).map(id => messageService.deleteMessage(id)))
      }
      setSelectedIds([])
      fetchData()
      toast.success('Mail has been deleted')
    } catch (err) {
      toast.error('Failed to delete items')
    }
  }

  const handleToggleStar = async (e, id, isDraftTab) => {
    e.stopPropagation()
    try {
      if (isDraftTab) {
        await messageService.toggleStar(id)
      } else {
        const t = threadsMap.get(id)
        if (t) {
          if (t.is_starred) {
            const starredMsgs = t.messages.filter(m => m.is_starred)
            await Promise.all(starredMsgs.map(m => messageService.toggleStar(m.id)))
          } else {
            await messageService.toggleStar(t.latestMsg.id)
          }
        }
      }
      fetchData()
    } catch (err) {
      toast.error('Failed to toggle star')
    }
  }

  const currentSelectedThread = activeTab !== 'drafts' && selectedThreadId ? threadsMap.get(selectedThreadId) : null;
  const isDraftTab = activeTab === 'drafts'

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

      {activeTab !== 'compose' && !currentSelectedThread && (
        <div ref={toolbarRef} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '24px' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button 
                onClick={handleSelectAll} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: selectedIds.length > 0 ? '#f97316' : '#64748b', display: 'flex', padding: '0 4px 0 0' }}
              >
                {selectedIds.length > 0 && selectedIds.length < listItems.length ? <MinusSquare size={18} /> : selectedIds.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
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
          {listItems.length === 0 && !currentSelectedThread ? (
            <div style={{ padding: '60px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
              No messages found.
            </div>
          ) : currentSelectedThread ? (
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button 
                  onClick={() => setSelectedThreadId(null)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b', padding: '8px', borderRadius: '50%', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  title="Back to list"
                >
                  <ArrowLeft size={20} />
                </button>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>{currentSelectedThread.subject}</h2>
              </div>
              
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', maxHeight: '600px' }}>
                {currentSelectedThread.messages.map((msg, idx) => {
                  const isMe = msg.sender_id === user?.id
                  return (
                    <div key={msg.id} style={{ display: 'flex', gap: '16px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: isMe ? '#3b82f6' : '#f97316', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                        {(isMe ? user?.full_name || 'Me' : msg.sender_name)?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ background: isMe ? '#eff6ff' : '#f8fafc', padding: '16px', borderRadius: '16px', border: `1px solid ${isMe ? '#bfdbfe' : '#e2e8f0'}`, maxWidth: '80%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '16px' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{isMe ? 'Me' : msg.sender_name}</span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(msg.created_at).toLocaleString()}</span>
                        </div>
                        <div style={{ color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.95rem' }}>
                          {msg.body}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ padding: '24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '0 0 16px 16px' }}>
                <textarea
                  placeholder="Type your reply here..."
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  rows={4}
                  style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical', marginBottom: '16px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => handleInlineReply(currentSelectedThread)}
                    style={{ padding: '12px 24px', background: '#f97316', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Send size={16} /> Send Reply
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: '0 0 12px 12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              {listItems.map((item) => {
                const isRead = isDraftTab ? item.is_read : item.is_read
                const msgData = isDraftTab ? item : item.latestMsg

                return (
                  <div 
                    key={item.id} 
                    onClick={() => isDraftTab ? handleDraftClick(item) : handleThreadClick(item)}
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
                      {selectedIds.includes(item.id) ? (
                        <CheckSquare 
                          size={18} 
                          strokeWidth={1.5} 
                          color="#f97316"
                          onClick={(e) => handleToggleSelect(e, item.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      ) : (
                        <Square 
                          size={18} 
                          strokeWidth={1.5} 
                          onClick={(e) => handleToggleSelect(e, item.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      )}
                      <Star 
                        size={18} 
                        strokeWidth={1.5} 
                        fill={item.is_starred ? '#facc15' : 'transparent'} 
                        color={item.is_starred ? '#facc15' : '#94a3b8'}
                        onClick={(e) => handleToggleStar(e, item.id, isDraftTab)}
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
                      color: isRead ? '#475569' : '#000000',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {isDraftTab ? (item.receiver_name || 'Draft') : (
                        <>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {activeTab === 'inbox' ? item.otherParticipantName : 
                             activeTab === 'sent' ? `To: ${item.otherParticipantName}` : item.otherParticipantName}
                          </span>
                          {item.messages.length > 1 && (
                            <span style={{ marginLeft: '6px', color: '#64748b', fontSize: '0.85rem' }}>{item.messages.length}</span>
                          )}
                        </>
                      )}
                    </div>
                    <div style={{ 
                      flex: 1, 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      gap: '8px'
                    }}>
                      <span style={{ fontWeight: isRead ? 400 : 800, color: isRead ? '#475569' : '#000000' }}>{msgData.subject || '(No subject)'}</span>
                      <span style={{ color: '#94a3b8' }}>-</span>
                      <span style={{ color: '#64748b' }}>{msgData.body.replace(/\n/g, ' ')}</span>
                    </div>
                    <div style={{ 
                      width: '100px', 
                      textAlign: 'right', 
                      fontSize: '0.8rem',
                      fontWeight: isRead ? 400 : 700,
                      color: isRead ? '#64748b' : '#0f172a'
                    }}>
                      {new Date(msgData.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
