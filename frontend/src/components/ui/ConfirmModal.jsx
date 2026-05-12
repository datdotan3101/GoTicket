/**
 * Reusable Confirm Modal for admin management pages.
 * Used for delete confirmation, update confirmation, etc.
 * 
 * Props:
 *  - isOpen: boolean — controls visibility
 *  - onClose: () => void — called when cancelled
 *  - onConfirm: () => void — called when confirmed
 *  - title: string — modal heading (default: "Confirm Action")
 *  - message: string | ReactNode — description text
 *  - confirmLabel: string — text on the confirm button (default: "Confirm")
 *  - variant: 'danger' | 'warning' | 'default' — controls button color (default: 'danger')
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure? This action cannot be undone.',
  confirmLabel = 'Confirm',
  variant = 'danger'
}) {
  if (!isOpen) return null

  const variantColors = {
    danger: { bg: '#fee2e2', icon: '#ef4444', btn: '#ef4444' },
    warning: { bg: '#fef3c7', icon: '#f59e0b', btn: '#f59e0b' },
    default: { bg: '#e0e7ff', icon: '#3b82f6', btn: '#111827' }
  }

  const colors = variantColors[variant] || variantColors.danger

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15,23,42,0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#fff',
        padding: '32px',
        borderRadius: '24px',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: colors.bg,
          color: colors.icon,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '1.5rem'
        }}>
          {variant === 'danger' ? '⚠️' : variant === 'warning' ? '⚡' : 'ℹ️'}
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '12px', color: '#0f172a' }}>
          {title}
        </h2>
        <p style={{ color: '#64748b', lineHeight: 1.5, marginBottom: '28px', fontSize: '0.95rem' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              background: '#f1f5f9',
              color: '#475569',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              background: colors.btn,
              color: '#fff',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
