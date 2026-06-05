import React from 'react';
import { Star, Square, CheckSquare } from 'lucide-react';

export default function MailboxList({
  listItems, isDraftTab, selectedIds, handleToggleSelect, handleToggleStar, 
  handleThreadClick, handleDraftClick, activeTab
}) {
  return (
    <div style={{ background: 'var(--color-white)', borderRadius: '0 0 12px 12px', border: '1px solid var(--color-slate-200)', overflow: 'hidden' }}>
      {listItems.map((item) => {
        const isRead = isDraftTab ? item.is_read : item.is_read;
        const msgData = isDraftTab ? item : item.latestMsg;

        return (
          <div 
            key={item.id} 
            onClick={() => isDraftTab ? handleDraftClick(item) : handleThreadClick(item)}
            style={{ 
              display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--color-slate-200)',
              background: isRead ? 'var(--color-slate-50)' : 'var(--color-white)', cursor: 'pointer', color: isRead ? 'var(--color-slate-600)' : 'var(--color-slate-900)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: '16px', color: 'var(--color-slate-400)' }}>
              {selectedIds.includes(item.id) ? (
                <CheckSquare size={18} strokeWidth={1.5} color="var(--color-orange)" onClick={(e) => handleToggleSelect(e, item.id)} />
              ) : (
                <Square size={18} strokeWidth={1.5} onClick={(e) => handleToggleSelect(e, item.id)} />
              )}
              <Star 
                size={18} strokeWidth={1.5} fill={item.is_starred ? '#facc15' : 'transparent'} 
                color={item.is_starred ? '#facc15' : 'var(--color-slate-400)'} onClick={(e) => handleToggleStar(e, item.id, isDraftTab)}
              />
            </div>
            <div style={{ width: '200px', minWidth: '200px', fontWeight: isRead ? 400 : 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
              {isDraftTab ? (item.receiver_name || 'Draft') : (
                <>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeTab === 'inbox' ? item.otherParticipantName : activeTab === 'sent' ? `To: ${item.otherParticipantName}` : item.otherParticipantName}
                  </span>
                  {item.messages.length > 1 && (
                    <span style={{ marginLeft: '6px', color: 'var(--color-slate-500)', fontSize: '0.85rem' }}>{item.messages.length}</span>
                  )}
                </>
              )}
            </div>
            <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', gap: '8px' }}>
              <span style={{ fontWeight: isRead ? 400 : 800, color: isRead ? 'var(--color-slate-600)' : 'var(--color-black)' }}>{msgData.subject || '(No subject)'}</span>
              <span style={{ color: 'var(--color-slate-400)' }}>-</span>
              <span style={{ color: 'var(--color-slate-500)' }}>{msgData.body.replace(/\n/g, ' ')}</span>
            </div>
            <div style={{ width: '100px', textAlign: 'right', fontSize: '0.8rem', fontWeight: isRead ? 400 : 700, color: isRead ? 'var(--color-slate-500)' : 'var(--color-slate-900)' }}>
              {new Date(msgData.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
