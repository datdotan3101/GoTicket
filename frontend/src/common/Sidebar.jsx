import { Link, useLocation } from 'react-router-dom'

export default function Sidebar({ menuSections }) {
  const location = useLocation()

  return (
    <div style={{
      width: '280px',
      backgroundColor: 'var(--color-white)',
      borderRight: '1px solid var(--color-slate-200)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      minHeight: '100%',
    }}>
      {menuSections.map((section, idx) => (
        <div key={idx} style={{ marginBottom: '24px' }}>
          <div style={{
            color: 'var(--color-primary)',
            fontSize: '0.8rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '0 24px',
            marginBottom: '16px'
          }}>
            {section.title}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {section.items.map((item, itemIdx) => {
              const isActuallyActive = ['/manager', '/admin', '/editor', '/checker', '/dashboard'].includes(item.path)
                ? location.pathname === item.path 
                : location.pathname.startsWith(item.path)

              return (
                <Link
                  key={itemIdx}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '14px 24px',
                    textDecoration: 'none',
                    color: isActuallyActive ? 'var(--color-black)' : '#374151',
                    backgroundColor: isActuallyActive ? 'var(--color-slate-100)' : 'transparent',
                    fontWeight: isActuallyActive ? '600' : '400',
                    transition: 'all 0.2s ease',
                    borderLeft: isActuallyActive ? '4px solid var(--color-primary)' : '4px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActuallyActive) e.currentTarget.style.backgroundColor = '#f9fafb'
                  }}
                  onMouseLeave={(e) => {
                    if (!isActuallyActive) e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <span style={{ marginRight: '16px', color: isActuallyActive ? 'var(--color-primary)' : 'var(--color-slate-500)', display: 'flex', alignItems: 'center' }}>
                    {item.icon}
                  </span>
                  <span style={{ fontSize: '0.95rem', flex: 1 }}>{item.name}</span>
                  
                  {item.badge > 0 && (
                    <span style={{
                      backgroundColor: 'var(--color-danger)',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      lineHeight: 1
                    }}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
