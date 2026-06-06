import { useState, useCallback } from 'react'
import { APP_ROUTES } from '../constants/routes'
import { LayoutDashboard, Trophy, Mailbox } from 'lucide-react'
import DashboardLayout from './DashboardLayout'
import { messageService } from '../services/messageService'
import { unwrapData } from '../utils/apiData'
import { usePolling } from '../hooks/usePolling'

export default function ManagerLayout() {
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnread = useCallback(async () => {
    try {
      const response = await messageService.getUnreadCount()
      const data = unwrapData(response)
      if (data?.count !== undefined) setUnreadCount(data.count)
    } catch {
      // Ignore error
    }
  }, [])

  usePolling(fetchUnread, ['message-read', 'message-sent'], 30000)

  const menuSections = [
    {
      title: 'MENU',
      items: [
        { name: 'Overview', path: APP_ROUTES.MANAGER_DASHBOARD, icon: <LayoutDashboard size={22} strokeWidth={1.25} /> },
        { name: 'Matches', path: APP_ROUTES.MANAGER_MATCHES, icon: <Trophy size={22} strokeWidth={1.25} /> },
        { name: 'Mailbox', path: APP_ROUTES.MANAGER_MAILBOX, icon: <Mailbox size={22} strokeWidth={1.25} />, badge: unreadCount }
      ]
    }
  ]

  return <DashboardLayout menuSections={menuSections} />
}
