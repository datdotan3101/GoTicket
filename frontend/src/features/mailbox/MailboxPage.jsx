import React, { useState, useEffect, useRef } from 'react';
import { Mail, Send, Search } from 'lucide-react';
import { messageService } from '../../services/messageService';
import { unwrapData } from '../../utils/apiData';
import { useAuthStore } from '../../store/authStore';
import { notifySuccess, notifyError } from '../../utils/toastUtils';

import MailboxToolbar from './MailboxToolbar';
import MailboxList from './MailboxList';
import MailboxThreadView from './MailboxThreadView';
import MailboxCompose from './MailboxCompose';

export default function MailboxPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ receiverId: '', subject: '', body: '' });
  
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  
  const [filter, setFilter] = useState('all');
  const [showKebab, setShowKebab] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const toolbarRef = useRef(null);
  const recipientDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target)) {
        setShowKebab(false);
        setShowFilterMenu(false);
      }
      if (recipientDropdownRef.current && !recipientDropdownRef.current.contains(event.target)) {
        setShowRecipientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setSelectedThreadId(null);
    setSelectedIds([]);
    setFilter('all');
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (['inbox', 'sent', 'starred'].includes(activeTab)) {
        const [inboxRes, sentRes] = await Promise.all([
          messageService.getInbox().catch(() => ({})),
          messageService.getSent().catch(() => ({}))
        ]);
        const inboxData = unwrapData(inboxRes) || [];
        const sentData = unwrapData(sentRes) || [];
        const allMsgs = [...inboxData, ...sentData];
        
        const uniqueMap = new Map();
        allMsgs.forEach(m => uniqueMap.set(m.id, m));
        setMessages(Array.from(uniqueMap.values()));
      } else if (activeTab === 'drafts') {
        const res = await messageService.getDrafts();
        setMessages(unwrapData(res) || []);
      } else if (activeTab === 'compose') {
        const res = await messageService.getRecipients();
        setRecipients(unwrapData(res) || []);
      }
    } catch (err) {
      notifyError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e, isDraft = false) => {
    if (e) e.preventDefault();
    if (!form.receiverId || !form.subject || !form.body) return notifyError('Please fill in all fields');
    
    try {
      await messageService.sendMessage({ ...form, is_draft: isDraft });
      notifySuccess(isDraft ? 'Draft saved!' : 'Message sent successfully!');
      setForm({ receiverId: '', subject: '', body: '' });
      if (!isDraft) window.dispatchEvent(new Event('message-sent'));
      setActiveTab(isDraft ? 'drafts' : 'sent');
    } catch (err) {
      notifyError('Failed to send message');
    }
  };

  const threadsMap = new Map();
  if (['inbox', 'sent', 'starred'].includes(activeTab)) {
    messages.forEach(msg => {
      const isSentByMe = msg.sender_id === user?.id;
      const otherId = isSentByMe ? msg.receiver_id : msg.sender_id;
      const otherName = isSentByMe ? msg.receiver_name : msg.sender_name;
      const normalizedSubject = (msg.subject || '').replace(/^(Re:\s*)+/gi, '').trim();
      const threadKey = `${normalizedSubject}_${otherId}`;
      
      if (!threadsMap.has(threadKey)) {
        threadsMap.set(threadKey, {
          id: threadKey, messages: [], latestDate: 0, subject: normalizedSubject || '(No subject)',
          otherParticipantId: otherId, otherParticipantName: otherName,
          hasInbox: false, hasSent: false, is_starred: false, is_read: true, latestMsg: null
        });
      }
      
      const thread = threadsMap.get(threadKey);
      thread.messages.push(msg);
      
      const msgTime = new Date(msg.created_at).getTime();
      if (msgTime > thread.latestDate) {
        thread.latestDate = msgTime;
        thread.latestMsg = msg;
      }
      
      if (msg.receiver_id === user?.id) {
        thread.hasInbox = true;
        if (!msg.is_read) thread.is_read = false;
      }
      if (msg.sender_id === user?.id) thread.hasSent = true;
      if (msg.is_starred) thread.is_starred = true;
    });
    threadsMap.forEach(t => t.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
  }

  let listItems = [];
  if (activeTab === 'drafts') {
    listItems = messages.filter(msg => {
      if (filter === 'read' && !msg.is_read) return false;
      if (filter === 'unread' && msg.is_read) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!((msg.receiver_name && msg.receiver_name.toLowerCase().includes(q)) ||
              (msg.subject && msg.subject.toLowerCase().includes(q)) ||
              (msg.body && msg.body.toLowerCase().includes(q)))) return false;
      }
      return true;
    });
  } else {
    const allThreads = Array.from(threadsMap.values()).sort((a, b) => b.latestDate - a.latestDate);
    listItems = allThreads.filter(thread => {
      if (activeTab === 'inbox' && !thread.hasInbox) return false;
      if (activeTab === 'sent' && !thread.hasSent) return false;
      if (activeTab === 'starred' && !thread.is_starred) return false;
      if (filter === 'read' && !thread.is_read) return false;
      if (filter === 'unread' && thread.is_read) return false;
      if (filter === 'starred' && !thread.is_starred) return false;
      if (filter === 'unstarred' && thread.is_starred) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!thread.messages.some(msg => 
          (msg.sender_name?.toLowerCase().includes(q)) ||
          (msg.receiver_name?.toLowerCase().includes(q)) ||
          (msg.subject?.toLowerCase().includes(q)) ||
          (msg.body?.toLowerCase().includes(q))
        )) return false;
      }
      
      if (dateFrom || dateTo) {
        if (dateFrom && thread.latestDate < new Date(dateFrom).getTime()) return false;
        if (dateTo) {
          const toD = new Date(dateTo);
          toD.setHours(23, 59, 59, 999);
          if (thread.latestDate > toD.getTime()) return false;
        }
      }
      return true;
    });
  }

  const handleThreadClick = (thread) => {
    setSelectedThreadId(thread.id);
    setReplyBody('');
    const unreadMsgs = thread.messages.filter(m => !m.is_read && m.receiver_id === user?.id);
    if (unreadMsgs.length > 0) {
      Promise.all(unreadMsgs.map(m => messageService.markAsRead(m.id))).then(() => {
        window.dispatchEvent(new Event('message-read'));
        fetchData();
      });
    }
  };

  const handleDraftClick = (msg) => {
    setForm({ receiverId: msg.receiver_id || '', subject: msg.subject || '', body: msg.body || '' });
    setActiveTab('compose');
  };

  const handleInlineReply = async (thread) => {
    if (!replyBody.trim()) return notifyError('Reply cannot be empty');
    try {
      const subject = thread.subject.startsWith('Re:') ? thread.subject : `Re: ${thread.subject}`;
      await messageService.sendMessage({ receiverId: thread.otherParticipantId, subject, body: replyBody.trim(), is_draft: false });
      notifySuccess('Reply sent!');
      setReplyBody('');
      window.dispatchEvent(new Event('message-sent'));
      fetchData();
    } catch (err) {
      notifyError('Failed to send reply');
    }
  };

  const handleToggleSelect = (e, id) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === listItems.length && listItems.length > 0) setSelectedIds([]);
    else setSelectedIds(listItems.map(item => item.id));
  };

  const handleMarkSelectedAsRead = async () => {
    try {
      if (activeTab === 'drafts') {
        await Promise.all(selectedIds.map(id => messageService.markAsRead(id)));
      } else {
        const unreadMsgs = [];
        selectedIds.forEach(tId => {
          const t = threadsMap.get(tId);
          if (t) t.messages.forEach(m => { if (!m.is_read && m.receiver_id === user?.id) unreadMsgs.push(m.id); });
        });
        await Promise.all(unreadMsgs.map(id => messageService.markAsRead(id)));
      }
      setSelectedIds([]);
      window.dispatchEvent(new Event('message-read'));
      fetchData();
      notifySuccess('Selected marked as read');
    } catch (err) {
      notifyError('Action failed');
    }
  };

  const handleMarkAllAsRead = async () => {
    setShowKebab(false);
    try {
      await messageService.markAllAsRead();
      window.dispatchEvent(new Event('message-read'));
      fetchData();
      notifySuccess('All messages marked as read');
    } catch (err) {
      notifyError('Failed to mark all as read');
    }
  };

  const handleDeleteSelected = async () => {
    try {
      if (activeTab === 'drafts') {
        await Promise.all(selectedIds.map(id => messageService.deleteMessage(id)));
      } else {
        const msgsToRemove = new Set();
        selectedIds.forEach(tId => {
          const t = threadsMap.get(tId);
          if (t) t.messages.forEach(m => msgsToRemove.add(m.id));
        });
        await Promise.all(Array.from(msgsToRemove).map(id => messageService.deleteMessage(id)));
      }
      setSelectedIds([]);
      fetchData();
      notifySuccess('Mail has been deleted');
    } catch (err) {
      notifyError('Failed to delete items');
    }
  };

  const handleToggleStar = async (e, id, isDraftTab) => {
    e.stopPropagation();
    try {
      if (isDraftTab) {
        await messageService.toggleStar(id);
      } else {
        const t = threadsMap.get(id);
        if (t) {
          if (t.is_starred) {
            const starredMsgs = t.messages.filter(m => m.is_starred);
            await Promise.all(starredMsgs.map(m => messageService.toggleStar(m.id)));
          } else {
            await messageService.toggleStar(t.latestMsg.id);
          }
        }
      }
      fetchData();
    } catch (err) {
      notifyError('Failed to toggle star');
    }
  };

  const currentSelectedThread = activeTab !== 'drafts' && selectedThreadId ? threadsMap.get(selectedThreadId) : null;
  const isDraftTab = activeTab === 'drafts';

  return (
    <section className="container page" style={{ padding: '40px 20px', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Mail size={32} color="var(--color-orange)" />
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: 'var(--color-slate-800)' }}>Mailbox</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-white)', border: '1px solid var(--color-slate-200)', borderRadius: '8px', padding: '6px 12px' }}>
            <Search size={16} color="var(--color-slate-400)" style={{ marginRight: '8px' }} />
            <input 
              type="text" placeholder="Search name, email, subject..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9rem', width: '220px' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)' }}>From:</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ padding: '6px', borderRadius: '8px', border: '1px solid var(--color-slate-200)', fontSize: '0.85rem', color: 'var(--color-slate-600)', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)' }}>To:</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ padding: '6px', borderRadius: '8px', border: '1px solid var(--color-slate-200)', fontSize: '0.85rem', color: 'var(--color-slate-600)', outline: 'none' }} />
          </div>
        </div>
      </div>

      {activeTab !== 'compose' && !currentSelectedThread && (
        <MailboxToolbar 
          toolbarRef={toolbarRef} handleSelectAll={handleSelectAll} selectedIds={selectedIds} listItems={listItems} 
          showFilterMenu={showFilterMenu} setShowFilterMenu={setShowFilterMenu} setShowKebab={setShowKebab} filter={filter} 
          setFilter={setFilter} handleDeleteSelected={handleDeleteSelected} handleMarkSelectedAsRead={handleMarkSelectedAsRead} 
          fetchData={fetchData} showKebab={showKebab} handleMarkAllAsRead={handleMarkAllAsRead} 
        />
      )}

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '2px solid var(--color-slate-200)', paddingBottom: '12px', overflowX: 'auto' }}>
        {['inbox', 'starred', 'drafts', 'sent'].map(tab => (
          <button 
            key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: '8px 16px', background: activeTab === tab ? 'var(--color-orange)' : 'transparent', color: activeTab === tab ? 'var(--color-white)' : 'var(--color-slate-500)', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', whiteSpace: 'nowrap' }}
          >{tab}</button>
        ))}
        <button 
          onClick={() => setActiveTab('compose')}
          style={{ padding: '8px 16px', background: activeTab === 'compose' ? 'var(--color-success)' : 'transparent', color: activeTab === 'compose' ? 'var(--color-white)' : 'var(--color-slate-500)', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto', whiteSpace: 'nowrap' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Send size={16} /> Compose</div>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-slate-400)' }}>Loading messages...</div>
      ) : activeTab === 'compose' ? (
        <MailboxCompose form={form} setForm={setForm} handleSend={handleSend} recipients={recipients} showRecipientDropdown={showRecipientDropdown} setShowRecipientDropdown={setShowRecipientDropdown} recipientSearch={recipientSearch} setRecipientSearch={setRecipientSearch} recipientDropdownRef={recipientDropdownRef} />
      ) : currentSelectedThread ? (
        <MailboxThreadView currentSelectedThread={currentSelectedThread} user={user} setSelectedThreadId={setSelectedThreadId} replyBody={replyBody} setReplyBody={setReplyBody} handleInlineReply={handleInlineReply} />
      ) : (
        <MailboxList listItems={listItems} isDraftTab={isDraftTab} selectedIds={selectedIds} handleToggleSelect={handleToggleSelect} handleToggleStar={handleToggleStar} handleThreadClick={handleThreadClick} handleDraftClick={handleDraftClick} activeTab={activeTab} />
      )}
    </section>
  );
}
