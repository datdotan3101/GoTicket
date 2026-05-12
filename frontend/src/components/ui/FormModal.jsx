/**
 * Reusable Form Modal for admin management pages (Clubs, Sports, Leagues, etc.)
 * 
 * Props:
 *  - isOpen: boolean — controls visibility
 *  - onClose: () => void — called when modal is closed
 *  - onSubmit: (e) => void — form submit handler
 *  - title: string — modal heading
 *  - submitLabel: string — text on the submit button (default: "Create")
 *  - submitDisabled: boolean — disables the submit button
 *  - children: ReactNode — form fields to render inside the modal
 *  - maxWidth: string — optional max width (default: "600px")
 */
export default function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  submitLabel = 'Create',
  submitDisabled = false,
  children,
  maxWidth = '600px'
}) {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15,23,42,0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        padding: '40px',
        maxWidth,
        width: '100%',
        borderRadius: '28px',
        border: 'none',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        background: '#fff'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111827', margin: 0 }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              color: '#64748b',
              width: '32px',
              height: '32px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          {children}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '12px',
                background: '#f1f5f9',
                color: '#475569',
                border: 'none',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitDisabled}
              style={{
                flex: 2,
                padding: '14px',
                borderRadius: '12px',
                background: '#111827',
                color: '#fff',
                border: 'none',
                fontWeight: 800,
                cursor: submitDisabled ? 'not-allowed' : 'pointer',
                opacity: submitDisabled ? 0.6 : 1
              }}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
