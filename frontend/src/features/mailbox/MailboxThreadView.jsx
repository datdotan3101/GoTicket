import React from 'react';
import { ArrowLeft, Send } from 'lucide-react';

export default function MailboxThreadView({
  currentSelectedThread, user, setSelectedThreadId, replyBody, 
  setReplyBody, handleInlineReply
}) {
  if (!currentSelectedThread) return null;

  return (
    <div style={{ background: 'var(--color-white)', borderRadius: '16px', border: '1px solid var(--color-slate-200)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--color-slate-200)', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={() => setSelectedThreadId(null)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--color-slate-500)', padding: '8px', borderRadius: '50%', transition: 'background 0.2s' }}
          title="Back to list"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--color-slate-800)' }}>{currentSelectedThread.subject}</h2>
      </div>
      
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', maxHeight: '600px' }}>
        {currentSelectedThread.messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} style={{ display: 'flex', gap: '16px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: isMe ? 'var(--color-primary)' : 'var(--color-orange)', color: 'var(--color-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                {(isMe ? user?.full_name || 'Me' : msg.sender_name)?.charAt(0).toUpperCase()}
              </div>
              <div style={{ background: isMe ? 'var(--color-primary-50)' : 'var(--color-slate-50)', padding: '16px', borderRadius: '16px', border: `1px solid ${isMe ? '#bfdbfe' : 'var(--color-slate-200)'}`, maxWidth: '80%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '16px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>{isMe ? 'Me' : msg.sender_name}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)' }}>{new Date(msg.created_at).toLocaleString()}</span>
                </div>
                <div style={{ color: 'var(--color-slate-700)', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  {msg.body}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '24px', borderTop: '1px solid var(--color-slate-200)', background: 'var(--color-slate-50)', borderRadius: '0 0 16px 16px' }}>
        <textarea
          placeholder="Type your reply here..."
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          rows={4}
          style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-slate-300)', outline: 'none', resize: 'vertical', marginBottom: '16px' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={() => handleInlineReply(currentSelectedThread)}
            style={{ padding: '12px 24px', background: 'var(--color-orange)', color: 'var(--color-white)', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Send size={16} /> Send Reply
          </button>
        </div>
      </div>
    </div>
  );
}
