/**
 * PageShell — Shared page wrapper for admin/manager pages.
 *
 * Provides:
 *  - Dot-grid background
 *  - Page header (title + optional subtitle + optional action slot)
 *  - Consistent padding
 *
 * Usage:
 *   <PageShell
 *     title="User Management"
 *     subtitle="Manage all registered users"
 *     action={<button>Add New</button>}
 *   >
 *     {content}
 *   </PageShell>
 */

import { dotGridPage } from '../../styles/common'

export default function PageShell({
  title,
  subtitle,
  accentColor = 'var(--color-orange)',
  action,
  children,
  style = {},
}) {
  return (
    <section
      style={{
        ...dotGridPage,
        border: 'none',
        maxWidth: 'none',
        ...style,
      }}
    >
      {/* Header */}
      {(title || action) && (
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            {title && (
              <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-slate-900)', margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>
                {title}
              </h1>
            )}
            {subtitle && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '4px', height: '20px', background: accentColor, borderRadius: '2px' }} />
                <span style={{ color: 'var(--color-slate-500)', fontSize: '1.05rem', fontStyle: 'italic' }}>
                  {subtitle}
                </span>
              </div>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}

      {children}
    </section>
  )
}
