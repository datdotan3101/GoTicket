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
 *  - variant: 'danger' | 'warning' | 'primary' | 'success' | 'default' — controls color (default: 'danger')
 *  - isLoading: boolean — if true, disables buttons and shows loading state
 */
import { Loader2 } from 'lucide-react'

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure? This action cannot be undone.',
  confirmLabel = 'Confirm',
  variant = 'danger',
  isLoading = false
}) {
  if (!isOpen) return null

  const variantColors = {
    danger: { bg: 'var(--color-danger-light)', icon: 'var(--color-danger)', btn: 'var(--color-danger)' },
    warning: { bg: '#fef3c7', icon: 'var(--color-warning)', btn: 'var(--color-warning)' },
    primary: { bg: 'var(--color-primary-100)', icon: 'var(--color-primary-600)', btn: 'var(--color-primary-600)' },
    success: { bg: '#dcfce7', icon: 'var(--color-success-alt)', btn: 'var(--color-success-alt)' },
    default: { bg: 'var(--color-slate-100)', icon: 'var(--color-slate-500)', btn: 'var(--color-slate-900)' }
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
        background: 'var(--color-white)',
        padding: '32px',
        borderRadius: '24px',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {isLoading && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255,255,255,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}>
            <Loader2 className="animate-spin" size={32} color={colors.btn} />
          </div>
        )}

                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '12px', color: 'var(--color-slate-900)' }}>
          {title}
        </h2>
        <div style={{ color: 'var(--color-slate-500)', lineHeight: 1.5, marginBottom: '28px', fontSize: '0.95rem' }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              background: 'var(--color-slate-100)',
              color: 'var(--color-slate-600)',
              fontWeight: 700,
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              background: colors.btn,
              color: 'var(--color-white)',
              fontWeight: 700,
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
