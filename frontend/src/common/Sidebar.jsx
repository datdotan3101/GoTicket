import { Link, useLocation } from 'react-router-dom'

export default function Sidebar({ menuSections }) {
  const location = useLocation()

  return (
    <div style={{
      width: '280px',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      minHeight: '100%',
    }}>
      {menuSections.map((section, idx) => (
        <div key={idx} style={{ marginBottom: '24px' }}>
          <div style={{
            color: '#3b82f6',
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
              const isDashboard = item.path.endsWith('/dashboard')
              const isActuallyActive = isDashboard 
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
                    color: isActuallyActive ? '#000000' : '#374151',
                    backgroundColor: isActuallyActive ? '#f3f4f6' : 'transparent',
                    fontWeight: isActuallyActive ? '600' : '400',
                    transition: 'all 0.2s ease',
                    borderLeft: isActuallyActive ? '4px solid #3b82f6' : '4px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActuallyActive) e.currentTarget.style.backgroundColor = '#f9fafb'
                  }}
                  onMouseLeave={(e) => {
                    if (!isActuallyActive) e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <span style={{ marginRight: '16px', color: isActuallyActive ? '#3b82f6' : '#6b7280', display: 'flex', alignItems: 'center' }}>
                    {item.icon}
                  </span>
                  <span style={{ fontSize: '0.95rem', flex: 1 }}>{item.name}</span>
                  
                  {item.badge > 0 && (
                    <span style={{
                      backgroundColor: '#ef4444',
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
