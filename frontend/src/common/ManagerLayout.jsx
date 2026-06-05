import { useEffect, useState } from 'react'
import { APP_ROUTES } from '../constants/routes'
import { LayoutDashboard, Trophy, Mailbox } from 'lucide-react'
import DashboardLayout from './DashboardLayout'
import { messageService } from '../services/messageService'
import { unwrapData } from '../utils/apiData'

export default function ManagerLayout() {
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
    
    const interval = setInterval(fetchUnread, 30000)
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
        { name: 'Overview', path: APP_ROUTES.MANAGER_DASHBOARD, icon: <LayoutDashboard size={22} strokeWidth={1.25} /> },
        { name: 'Matches', path: APP_ROUTES.MANAGER_MATCHES, icon: <Trophy size={22} strokeWidth={1.25} /> },
        { name: 'Mailbox', path: APP_ROUTES.MANAGER_MAILBOX, icon: <Mailbox size={22} strokeWidth={1.25} />, badge: unreadCount }
      ]
    }
  ]

  return <DashboardLayout menuSections={menuSections} />
}
