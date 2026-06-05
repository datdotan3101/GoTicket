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
  background: 'var(--color-white)',
  borderRadius: '16px',
  border: '1px solid var(--color-slate-200)',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
}

/** card + padding 24px (most common variant) */
export const cardPadded = {
  ...card,
  padding: '24px',
}

/** Rounded card with larger padding, used in Profile / detail sections */
export const cardSection = {
  background: 'var(--color-white)',
  border: '1px solid var(--color-slate-200)',
  borderRadius: '20px',
  padding: '32px 36px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
  animation: 'fadeIn 0.3s ease-out',
}

/** Full-page dot-grid background (admin pages) */
export const dotGridPage = {
  backgroundImage: 'radial-gradient(var(--color-slate-300) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
  backgroundColor: 'var(--color-slate-50)',
  minHeight: '100vh',
  padding: '40px',
  paddingBottom: '80px',
}

// ─── Typography ────────────────────────────────────────────────────────────

/** Uppercase micro-label above inputs */
export const fieldLabel = {
  fontSize: '12px',
  fontWeight: 800,
  color: 'var(--color-slate-600)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

/** Admin page big header (h1) */
export const adminHeader = {
  fontSize: '3rem',
  fontWeight: 950,
  textTransform: 'uppercase',
  letterSpacing: '-2px',
  color: 'var(--color-slate-900)',
  lineHeight: 1,
  margin: 0,
}

/** Section subtitle / description text */
export const sectionSubtitle = {
  fontSize: '1rem',
  color: 'var(--color-slate-500)',
  marginTop: '8px',
}

// ─── Form elements ─────────────────────────────────────────────────────────

/** Base text input / select style */
export const inputBase = {
  background: 'var(--color-slate-50)',
  border: '1px solid var(--color-slate-200)',
  borderRadius: '12px',
  padding: '14px 18px',
  fontSize: '15px',
  color: 'var(--color-slate-800)',
  outline: 'none',
  transition: 'all 0.2s',
  width: '100%',
  boxSizing: 'border-box',
}

/** Focused input (apply onFocus / remove onBlur) */
export const inputFocused = {
  borderColor: 'var(--color-primary)',
  background: 'var(--color-white)',
}

/** Blurred input (revert on onBlur) */
export const inputBlurred = {
  borderColor: 'var(--color-slate-200)',
  background: 'var(--color-slate-50)',
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
  color: 'var(--color-white)',
}

/** Red danger button (Delete, Change Password) */
export const btnDanger = {
  ...btnBase,
  background: 'var(--color-danger)',
  color: 'var(--color-white)',
}

/** Red delete confirmation button */
export const btnDelete = {
  ...btnBase,
  background: 'var(--color-danger-dark)',
  color: 'var(--color-white)',
}

/** Ghost / cancel button */
export const btnCancel = {
  ...btnBase,
  background: 'var(--color-white)',
  border: '1px solid #d1d5db',
  color: '#374151',
}

/** Small icon-only button (used in tables) */
export const btnIcon = {
  background: 'none',
  border: 'none',
  color: 'var(--color-slate-500)',
  cursor: 'pointer',
  padding: '8px',
}

/** Admin "Add New" dark button */
export const btnAddNew = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: 'var(--color-slate-900)',
  color: 'var(--color-white)',
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
  background: 'var(--color-white)',
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
export const badgeBlocked = { ...badgeBase, background: 'var(--color-danger-light)', color: 'var(--color-danger-dark)' }
export const badgePending = { ...badgeBase, background: '#fef9c3', color: '#ca8a04' }
export const badgeRole = { ...badgeBase, background: 'var(--color-primary-100)', color: 'var(--color-primary-600)' }

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
    audience: { background: 'var(--color-primary-100)', color: 'var(--color-primary-600)' },
  }
  return { ...badgeBase, ...(map[role] ?? map.audience) }
}

// ─── Table ──────────────────────────────────────────────────────────────────

export const tableHeaderCell = {
  textAlign: 'left',
  padding: '16px 0',
  fontSize: '0.75rem',
  fontWeight: 800,
  color: 'var(--color-slate-500)',
  textTransform: 'uppercase',
  letterSpacing: '1px',
}

export const tableRow = {
  borderBottom: '1px solid var(--color-slate-100)',
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
    blue: { background: 'var(--color-primary-100)', color: 'var(--color-primary-600)' },
    red: { background: '#fef2f2', color: 'var(--color-danger)' },
    yellow: { background: '#fef9c3', color: '#ca8a04' },
    green: { background: '#d1fae5', color: 'var(--color-success)' },
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
  background: 'var(--color-slate-100)',
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
