/**
 * DeleteAccountTab — "Danger Zone" tab + delete confirmation modal.
 * Receives state/handlers from useProfile via props.
 */
import { dangerZone, btnDelete } from '../../styles/common'
import ConfirmModal from '../../components/ui/ConfirmModal'

export default function DeleteAccountTab({
  showDeleteModal,
  setShowDeleteModal,
  deleteLoading,
  deleteConfirmText,
  setDeleteConfirmText,
  onConfirm,
}) {
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
          onMouseLeave={(e) => (e.target.style.background = 'var(--color-danger-dark)')}
        >
          Delete Account
        </button>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={onConfirm}
        title="Confirm Account Deletion"
        message="This action cannot be undone. All your data may be permanently deleted or hidden from the system. Are you sure you want to continue?"
        confirmLabel={deleteLoading ? "Deleting..." : "Confirm Deletion"}
        variant="danger"
        isLoading={deleteLoading}
      />
    </>
  )
}
