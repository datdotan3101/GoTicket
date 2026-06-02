/**
 * shared style objects — import and use instead of copy-pasting inline styles.
 *
 * Usage:
 *   import { card, inputBase, btnPrimary } from '../../styles/common'
 *   <div style={card}>...</div>
 */

// ─── Layout ────────────────────────────────────────────────────────────────

/** Standard white card with shadow */
export const card = {
  background: '#ffffff',
  borderRadius: '16px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
}

/** card + padding 24px (most common variant) */
export const cardPadded = {
  ...card,
  padding: '24px',
}

/** Rounded card with larger padding, used in Profile / detail sections */
export const cardSection = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '20px',
  padding: '32px 36px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
  animation: 'fadeIn 0.3s ease-out',
}

/** Full-page dot-grid background (admin pages) */
export const dotGridPage = {
  backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
  backgroundSize: '24px 24px',
  backgroundColor: '#f8fafc',
  minHeight: '100vh',
  padding: '40px',
  paddingBottom: '80px',
}

// ─── Typography ────────────────────────────────────────────────────────────

/** Uppercase micro-label above inputs */
export const fieldLabel = {
  fontSize: '12px',
  fontWeight: 800,
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

/** Admin page big header (h1) */
export const adminHeader = {
  fontSize: '3rem',
  fontWeight: 950,
  textTransform: 'uppercase',
  letterSpacing: '-2px',
  color: '#111827',
  lineHeight: 1,
  margin: 0,
}

/** Section subtitle / description text */
export const sectionSubtitle = {
  fontSize: '1rem',
  color: '#6b7280',
  marginTop: '8px',
}

// ─── Form elements ─────────────────────────────────────────────────────────

/** Base text input / select style */
export const inputBase = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '14px 18px',
  fontSize: '15px',
  color: '#1e293b',
  outline: 'none',
  transition: 'all 0.2s',
  width: '100%',
  boxSizing: 'border-box',
}

/** Focused input (apply onFocus / remove onBlur) */
export const inputFocused = {
  borderColor: '#6366f1',
  background: '#ffffff',
}

/** Blurred input (revert on onBlur) */
export const inputBlurred = {
  borderColor: '#e2e8f0',
  background: '#f8fafc',
}

/** Flex column wrapper for a label + input field group */
export const fieldGroup = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

// ─── Buttons ────────────────────────────────────────────────────────────────

/** Base button reset */
const btnBase = {
  border: 'none',
  borderRadius: '8px',
  padding: '14px 32px',
  fontSize: '14px',
  fontWeight: 800,
  cursor: 'pointer',
  transition: 'all 0.2s',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

/** Dark primary button (Save Changes, etc.) */
export const btnPrimary = {
  ...btnBase,
  background: '#1e1514',
  color: '#ffffff',
}

/** Red danger button (Delete, Change Password) */
export const btnDanger = {
  ...btnBase,
  background: '#ef4444',
  color: '#ffffff',
}

/** Red delete confirmation button */
export const btnDelete = {
  ...btnBase,
  background: '#dc2626',
  color: '#ffffff',
}

/** Ghost / cancel button */
export const btnCancel = {
  ...btnBase,
  background: '#ffffff',
  border: '1px solid #d1d5db',
  color: '#374151',
}

/** Small icon-only button (used in tables) */
export const btnIcon = {
  background: 'none',
  border: 'none',
  color: '#64748b',
  cursor: 'pointer',
  padding: '8px',
}

/** Admin "Add New" dark button */
export const btnAddNew = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: '#0f172a',
  color: '#ffffff',
  border: 'none',
  padding: '10px 16px',
  borderRadius: '8px',
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: '0.9rem',
}

// ─── Modals ─────────────────────────────────────────────────────────────────

/** Modal backdrop (full-screen overlay) */
export const modalBackdrop = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15,23,42,0.7)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
}

/** Modal content box */
export const modalBox = {
  background: '#ffffff',
  padding: '32px',
  borderRadius: '20px',
  maxWidth: '500px',
  width: '100%',
  boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
}

/** Modal action row at the bottom */
export const modalActions = {
  display: 'flex',
  gap: '12px',
  marginTop: '24px',
}

// ─── Badges / Tags ──────────────────────────────────────────────────────────

/** Base pill/badge style */
const badgeBase = {
  display: 'inline-block',
  padding: '4px 12px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

export const badgeActive = { ...badgeBase, background: '#dcfce7', color: '#16a34a' }
export const badgeBlocked = { ...badgeBase, background: '#fee2e2', color: '#dc2626' }
export const badgePending = { ...badgeBase, background: '#fef9c3', color: '#ca8a04' }
export const badgeRole = { ...badgeBase, background: '#e0e7ff', color: '#4f46e5' }

/**
 * Generate a role-specific color badge.
 * @param {'admin'|'manager'|'editor'|'checker'|'audience'} role
 */
export const badgeForRole = (role) => {
  const map = {
    admin: { background: '#fef3c7', color: '#92400e' },
    manager: { background: '#ede9fe', color: '#6d28d9' },
    editor: { background: '#dbeafe', color: '#1e3a8a' },
    checker: { background: '#d1fae5', color: '#065f46' },
    audience: { background: '#e0e7ff', color: '#4f46e5' },
  }
  return { ...badgeBase, ...(map[role] ?? map.audience) }
}

// ─── Table ──────────────────────────────────────────────────────────────────

export const tableHeaderCell = {
  textAlign: 'left',
  padding: '16px 0',
  fontSize: '0.75rem',
  fontWeight: 800,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '1px',
}

export const tableRow = {
  borderBottom: '1px solid #f1f5f9',
}

export const tableCell = {
  padding: '16px 0',
}

// ─── Section header row (icon + title + subtitle) ───────────────────────────

/**
 * Returns styles for the icon box beside a section heading.
 * @param {'blue'|'red'|'yellow'|'green'} variant
 */
export const sectionIconBox = (variant = 'blue') => {
  const map = {
    blue: { background: '#e0e7ff', color: '#4f46e5' },
    red: { background: '#fef2f2', color: '#ef4444' },
    yellow: { background: '#fef9c3', color: '#ca8a04' },
    green: { background: '#d1fae5', color: '#10b981' },
  }
  return {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...(map[variant] ?? map.blue),
  }
}

// ─── Danger / Warning zones ──────────────────────────────────────────────────

export const dangerZone = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '16px',
  background: '#fef2f2',
  padding: '24px',
  borderRadius: '12px',
  border: '1px dashed #fca5a5',
}

export const warningBox = {
  background: '#fef9c3',
  border: '1px solid #fde68a',
  borderRadius: '12px',
  padding: '14px 18px',
}

// ─── Misc helpers ────────────────────────────────────────────────────────────

/** Horizontal divider */
export const divider = {
  height: '1px',
  background: '#f1f5f9',
  margin: '8px 0',
}

/** Flex row centred */
export const flexCenter = {
  display: 'flex',
  alignItems: 'center',
}

/** Flex row centred + gap 8px */
export const flexRow = (gap = 8) => ({
  display: 'flex',
  alignItems: 'center',
  gap: `${gap}px`,
})

/** Flex column + gap */
export const flexCol = (gap = 8) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: `${gap}px`,
})
