/**
 * AdminPageHeader — Reusable page header for all admin/manager pages.
 *
 * Usage:
 *   <AdminPageHeader
 *     title="User Management"
 *     subtitle="Professional stadium operations system"
 *     action={<button>Add New</button>}
 *   />
 */
export default function AdminPageHeader({ title, subtitle, accentColor = '#f97316', action }) {
  return (
    <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>
          {title}
        </h1>
        {subtitle && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '4px', height: '20px', background: accentColor, borderRadius: '2px' }} />
            <span style={{ color: '#64748b', fontSize: '1.05rem', fontStyle: 'italic' }}>
              {subtitle}
            </span>
          </div>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
