import { Link, useLocation } from 'react-router-dom'
import { APP_ROUTES } from '../../constants/routes'
import { 
  LayoutDashboard, 
  Trophy 
} from 'lucide-react'

export default function ManagerNavbar() {
  const location = useLocation()

  const menuSections = [
    {
      title: 'MENU',
      items: [
        { name: 'Overview', path: APP_ROUTES.MANAGER_DASHBOARD, icon: <LayoutDashboard size={22} strokeWidth={1.25} /> },
        { name: 'Matches', path: APP_ROUTES.MANAGER_MATCHES, icon: <Trophy size={22} strokeWidth={1.25} /> }
      ]
    }
  ]

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
              const isActuallyActive = item.path === APP_ROUTES.MANAGER_DASHBOARD 
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
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
