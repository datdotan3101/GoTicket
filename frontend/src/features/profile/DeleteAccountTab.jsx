/**
 * DeleteAccountTab — "Danger Zone" tab + delete confirmation modal.
 * Receives state/handlers from useProfile via props.
 */
import { AlertTriangle } from 'lucide-react'
import { dangerZone, btnDelete, btnCancel, modalBackdrop, sectionIconBox } from '../../styles/common'

export default function DeleteAccountTab({
  showDeleteModal,
  setShowDeleteModal,
  deleteLoading,
  deleteConfirmText,
  setDeleteConfirmText,
  onConfirm,
}) {
  const canConfirm = deleteConfirmText === 'Delete'

  return (
    <>
      {/* Danger Zone card content */}
      <div style={dangerZone}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: '#991b1b' }}>
            Thinking of leaving?
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: '#b91c1c', lineHeight: 1.5 }}>
            When you delete your account, all personal information and purchased tickets may be
            hidden or permanently deleted from the system. This action cannot be undone.
          </p>
        </div>
        <button
          onClick={() => setShowDeleteModal(true)}
          style={btnDelete}
          onMouseEnter={(e) => (e.target.style.background = '#b91c1c')}
          onMouseLeave={(e) => (e.target.style.background = '#dc2626')}
        >
          Delete Account
        </button>
      </div>

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <div style={{ ...modalBackdrop, zIndex: 9999 }}>
          <div
            className="modal-content"
            style={{ maxWidth: '460px', padding: 0, overflow: 'hidden', borderRadius: '20px', background: '#fff' }}
          >
            {/* Modal body */}
            <div style={{ padding: '32px 32px 24px', textAlign: 'center' }}>
              <div style={{ ...sectionIconBox('red'), width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 20px', color: '#dc2626' }}>
                <AlertTriangle size={32} />
              </div>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: 900, color: '#111827', letterSpacing: '-0.5px' }}>
                Confirm Account Deletion
              </h3>
              <p style={{ margin: '0 0 24px 0', fontSize: '15px', color: '#6b7280', lineHeight: 1.5 }}>
                This action <strong style={{ color: '#dc2626' }}>cannot be undone</strong>. All
                your data may be permanently deleted or hidden from the system. Are you sure you
                want to continue?
              </p>

              <div style={{ textAlign: 'left', background: '#fef2f2', padding: '16px', borderRadius: '12px', border: '1px solid #fecaca' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#991b1b', marginBottom: '8px' }}>
                  Please type <strong style={{ userSelect: 'none' }}>&quot;Delete&quot;</strong> to confirm:
                </label>
                <input
                  type="text"
                  placeholder="Type 'Delete'..."
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #fca5a5',
                    fontSize: '15px',
                    outline: 'none',
                    background: '#fff',
                    color: '#7f1d1d',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#ef4444')}
                  onBlur={(e) => (e.target.style.borderColor = '#fca5a5')}
                />
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ padding: '20px 32px 32px', display: 'flex', gap: '12px', background: '#f9fafb', borderTop: '1px solid #f3f4f6' }}>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}
                disabled={deleteLoading}
                style={{ ...btnCancel, flex: 1, padding: '12px', cursor: deleteLoading ? 'not-allowed' : 'pointer' }}
                onMouseEnter={(e) => !deleteLoading && (e.target.style.background = '#f3f4f6')}
                onMouseLeave={(e) => !deleteLoading && (e.target.style.background = '#fff')}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={deleteLoading || !canConfirm}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  fontWeight: 800,
                  color: '#fff',
                  background: canConfirm ? '#dc2626' : '#fca5a5',
                  cursor: deleteLoading || !canConfirm ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => { if (!deleteLoading && canConfirm) e.target.style.background = '#b91c1c' }}
                onMouseLeave={(e) => { if (!deleteLoading && canConfirm) e.target.style.background = '#dc2626' }}
              >
                {deleteLoading ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
