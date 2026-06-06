import { useState, useCallback } from 'react'
import { APP_ROUTES } from '../constants/routes'
import { messageService } from '../services/messageService'
import { approvalsService } from '../services/approvalsService'
import { unwrapData } from '../utils/apiData'
import { usePolling } from '../hooks/usePolling'
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
  const [pendingMatchesCount, setPendingMatchesCount] = useState(0)

  const fetchCounts = useCallback(async () => {
    try {
      const [msgRes, matchRes] = await Promise.all([
        messageService.getUnreadCount().catch(() => ({})),
        approvalsService.getPending({ type: 'match' }).catch(() => ({}))
      ])

      const msgData = unwrapData(msgRes)
      if (msgData?.count !== undefined) setUnreadCount(msgData.count)

      const matchData = unwrapData(matchRes)
      if (Array.isArray(matchData)) {
        setPendingMatchesCount(matchData.length)
      }
    } catch {
      // Ignore error
    }
  }, [])

  usePolling(fetchCounts, ['message-read', 'message-sent', 'approval-updated'], 30000)

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
        { name: 'Matches', path: APP_ROUTES.ADMIN_MATCHES, icon: <Trophy size={22} strokeWidth={1.25} />, badge: pendingMatchesCount },
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
