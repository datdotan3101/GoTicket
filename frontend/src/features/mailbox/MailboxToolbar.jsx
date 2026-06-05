import React from 'react';
import { Square, CheckSquare, MinusSquare, Trash2, MailOpen, RefreshCw, MoreVertical } from 'lucide-react';

export default function MailboxToolbar({
  toolbarRef, handleSelectAll, selectedIds, listItems, showFilterMenu, setShowFilterMenu,
  setShowKebab, filter, setFilter, handleDeleteSelected, handleMarkSelectedAsRead,
  fetchData, showKebab, handleMarkAllAsRead
}) {
  return (
    <div ref={toolbarRef} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', background: 'var(--color-white)', border: '1px solid var(--color-slate-200)', borderRadius: '12px', marginBottom: '24px' }}>
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={handleSelectAll} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: selectedIds.length > 0 ? 'var(--color-orange)' : 'var(--color-slate-500)', display: 'flex', padding: '0 4px 0 0' }}>
            {selectedIds.length > 0 && selectedIds.length < listItems.length ? <MinusSquare size={18} /> : selectedIds.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
          </button>
          <button onClick={() => { setShowFilterMenu(!showFilterMenu); setShowKebab(false); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-slate-500)', display: 'flex', padding: '0 4px' }}>
            <span style={{ fontSize: '0.8rem' }}>▼</span>
          </button>
        </div>
        {showFilterMenu && (
          <div style={{ position: 'absolute', top: '100%', left: 0, background: 'var(--color-white)', border: '1px solid var(--color-slate-200)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, padding: '8px 0', minWidth: '120px' }}>
            {['all', 'read', 'unread', 'starred', 'unstarred'].map(f => (
              <div 
                key={f} onClick={() => { setFilter(f); setShowFilterMenu(false) }}
                style={{ padding: '8px 16px', cursor: 'pointer', textTransform: 'capitalize', fontSize: '0.9rem', background: filter === f ? 'var(--color-slate-100)' : 'transparent', color: 'var(--color-slate-800)' }}
              >
                {f}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {selectedIds.length > 0 ? (
        <>
          <button onClick={handleDeleteSelected} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-slate-500)', display: 'flex' }} title="Delete"><Trash2 size={18} /></button>
          <button onClick={handleMarkSelectedAsRead} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-slate-500)', display: 'flex' }} title="Mark as read"><MailOpen size={18} /></button>
          <div style={{ flex: 1 }}></div>
          <span style={{ fontSize: '0.9rem', color: 'var(--color-slate-500)', fontWeight: 600 }}>{selectedIds.length} selected</span>
        </>
      ) : (
        <>
          <button onClick={fetchData} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-slate-500)', display: 'flex' }} title="Refresh"><RefreshCw size={18} /></button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => { setShowKebab(!showKebab); setShowFilterMenu(false); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-slate-500)', display: 'flex' }}><MoreVertical size={18} /></button>
            {showKebab && (
              <div style={{ position: 'absolute', top: '100%', left: 0, background: 'var(--color-white)', border: '1px solid var(--color-slate-200)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, padding: '8px 0', minWidth: '150px' }}>
                <div onClick={handleMarkAllAsRead} style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--color-slate-800)' }}>Mark all as read</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
