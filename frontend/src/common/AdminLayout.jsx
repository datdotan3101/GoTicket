import { useEffect, useState } from 'react'
import { APP_ROUTES } from '../constants/routes'
import { approvalsService } from '../services/approvalsService'
import { unwrapData } from '../utils/apiData'
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  Activity, 
  Medal,
  PieChart,
  Shield,
  UserCog
} from 'lucide-react'
import DashboardLayout from './DashboardLayout'

export default function AdminLayout() {
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

  return <DashboardLayout menuSections={menuSections} />
}
