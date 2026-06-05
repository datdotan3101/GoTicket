import { useEffect, useState } from 'react'
import { APP_ROUTES } from '../constants/routes'
import { messageService } from '../services/messageService'
import { unwrapData } from '../utils/apiData'
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  Activity, 
  Medal,
  Shield,
  UserCog,
  MapPin,
  Mailbox
} from 'lucide-react'
import DashboardLayout from './DashboardLayout'

export default function AdminLayout() {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const response = await messageService.getUnreadCount()
        const data = unwrapData(response)
        if (data?.count !== undefined) setUnreadCount(data.count)
      } catch {
        // Ignore error
      }
    }

    fetchUnread()
    
    window.addEventListener('message-read', fetchUnread)
    window.addEventListener('message-sent', fetchUnread)
    
    const interval = setInterval(() => {
      fetchUnread()
    }, 30000)
    return () => {
      clearInterval(interval)
      window.removeEventListener('message-read', fetchUnread)
      window.removeEventListener('message-sent', fetchUnread)
    }
  }, [])

  const menuSections = [
    {
      title: 'MENU',
      items: [
        { name: 'Dashboard', path: APP_ROUTES.ADMIN_DASHBOARD, icon: <LayoutDashboard size={22} strokeWidth={1.25} /> },
        { name: 'Mailbox', path: APP_ROUTES.ADMIN_MAILBOX, icon: <Mailbox size={22} strokeWidth={1.25} />, badge: unreadCount }
      ]
    },
    {
      title: 'SPORT MANAGEMENT',
      items: [
        { name: 'Matches', path: APP_ROUTES.ADMIN_MATCHES, icon: <Trophy size={22} strokeWidth={1.25} /> },
        { name: 'Stadiums', path: APP_ROUTES.ADMIN_STADIUMS, icon: <MapPin size={22} strokeWidth={1.25} /> },
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
