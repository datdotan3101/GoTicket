import React from 'react';

export default function MailboxCompose({
  form, setForm, handleSend, recipients, showRecipientDropdown, 
  setShowRecipientDropdown, recipientSearch, setRecipientSearch, recipientDropdownRef
}) {
  return (
    <form onSubmit={(e) => handleSend(e, false)} style={{ background: 'var(--color-white)', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }} ref={recipientDropdownRef}>
          <label style={{ fontWeight: 600, color: 'var(--color-slate-600)' }}>To</label>
          <div 
            onClick={() => setShowRecipientDropdown(true)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--color-slate-300)', cursor: 'text', minHeight: '46px', display: 'flex', alignItems: 'center', background: 'var(--color-white)' }}
          >
            {showRecipientDropdown ? (
              <input 
                autoFocus value={recipientSearch} onChange={(e) => setRecipientSearch(e.target.value)}
                placeholder="Type to search..." style={{ border: 'none', outline: 'none', width: '100%', fontSize: '1rem' }}
              />
            ) : (
              <span style={{ color: form.receiverId ? 'var(--color-slate-900)' : 'var(--color-slate-400)' }}>
                {form.receiverId 
                  ? (() => { const r = recipients.find(x => x.id === form.receiverId); return r ? `${r.full_name} (${r.email})` : 'Unknown'; })() 
                  : 'Select recipient...'}
              </span>
            )}
          </div>
          
          {showRecipientDropdown && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--color-white)', border: '1px solid var(--color-slate-300)', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              {recipients.filter(r => (r.full_name + ' ' + r.email).toLowerCase().includes(recipientSearch.toLowerCase())).map(r => (
                <div 
                  key={r.id}
                  onClick={() => {
                    setForm({...form, receiverId: r.id});
                    setShowRecipientDropdown(false);
                    setRecipientSearch('');
                  }}
                  style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--color-slate-100)' }}
                >
                  {r.full_name} <span style={{ color: 'var(--color-slate-500)', fontSize: '0.9em' }}>({r.email})</span>
                </div>
              ))}
              {recipients.filter(r => (r.full_name + ' ' + r.email).toLowerCase().includes(recipientSearch.toLowerCase())).length === 0 && (
                <div style={{ padding: '10px 12px', color: 'var(--color-slate-400)', textAlign: 'center' }}>No recipients found</div>
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: 600, color: 'var(--color-slate-600)' }}>Subject</label>
          <input 
            type="text" placeholder="Enter subject" value={form.subject}
            onChange={e => setForm({...form, subject: e.target.value})}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--color-slate-300)', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: 600, color: 'var(--color-slate-600)' }}>Message</label>
          <textarea 
            placeholder="Type your message here..." rows={6} value={form.body}
            onChange={e => setForm({...form, body: e.target.value})}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--color-slate-300)', outline: 'none', resize: 'vertical' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <button type="submit" style={{ padding: '14px 24px', background: 'var(--color-orange)', color: 'var(--color-white)', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
            Send Message
          </button>
          <button type="button" onClick={() => handleSend(null, true)} style={{ padding: '14px 24px', background: 'var(--color-slate-100)', color: 'var(--color-slate-600)', border: '1px solid var(--color-slate-300)', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
            Save Draft
          </button>
        </div>
      </div>
    </form>
  );
}
