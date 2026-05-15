import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { APP_ROUTES } from '../../constants/routes'
import { approvalsService } from '../../services/approvalsService'
import { unwrapData } from '../../utils/apiData'
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  Users, 
  Trophy, 
  Activity, 
  Medal,
  PieChart,
  Shield,
  UserCog
} from 'lucide-react'

export default function AdminNavbar() {
  const location = useLocation()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const response = await approvalsService.getPending({ type: 'match' })
        const data = unwrapData(response) || []
        setPendingCount(data.length)
      } catch {
        // Ignore error
      }
    }

    fetchPending()
    
    // Listen for manual updates from other components
    const handleUpdate = () => fetchPending()
    window.addEventListener('approval-updated', handleUpdate)
    
    const interval = setInterval(fetchPending, 30000)
    return () => {
      clearInterval(interval)
      window.removeEventListener('approval-updated', handleUpdate)
    }
  }, [])

  const menuSections = [
    {
      title: 'MENU',
      items: [
        { name: 'Dashboard', path: APP_ROUTES.ADMIN_DASHBOARD, icon: <LayoutDashboard size={22} strokeWidth={1.25} /> },
        { name: 'Revenue Report', path: APP_ROUTES.ADMIN_REVENUE_REPORT, icon: <PieChart size={22} strokeWidth={1.25} /> }
      ]
    },
    {
      title: 'SPORT MANAGEMENT',
      items: [
        { name: 'Matches', path: APP_ROUTES.ADMIN_MATCHES, icon: <Trophy size={22} strokeWidth={1.25} />, badge: pendingCount },
        { name: 'Clubs', path: APP_ROUTES.ADMIN_CLUBS, icon: <Shield size={22} strokeWidth={1.25} /> },
        { name: 'Sports', path: APP_ROUTES.ADMIN_SPORTS, icon: <Activity size={22} strokeWidth={1.25} /> },
        { name: 'Leagues', path: APP_ROUTES.ADMIN_LEAGUES, icon: <Medal size={22} strokeWidth={1.25} /> }
      ]
    },
    {
      title: 'USER MANAGEMENT',
      items: [
        { name: 'Account Manager', path: APP_ROUTES.ADMIN_MANAGERS, icon: <UserCog size={22} strokeWidth={1.25} /> },
        { name: 'Users', path: APP_ROUTES.ADMIN_USERS, icon: <Users size={22} strokeWidth={1.25} /> }
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
            color: '#3b82f6', // Matches the blue color in the image
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
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={itemIdx}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '14px 24px',
                    textDecoration: 'none',
                    color: isActive ? '#000000' : '#374151',
                    backgroundColor: isActive ? '#f3f4f6' : 'transparent',
                    fontWeight: isActive ? '600' : '400',
                    transition: 'all 0.2s ease',
                    borderLeft: isActive ? '4px solid #3b82f6' : '4px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = '#f9fafb'
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <span style={{ marginRight: '16px', color: isActive ? '#3b82f6' : '#6b7280', display: 'flex', alignItems: 'center' }}>
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
