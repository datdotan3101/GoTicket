import { APP_ROUTES } from '../constants/routes'
import { LayoutDashboard, Trophy } from 'lucide-react'
import DashboardLayout from './DashboardLayout'

export default function ManagerLayout() {
  const menuSections = [
    {
      title: 'MENU',
      items: [
        { name: 'Overview', path: APP_ROUTES.MANAGER_DASHBOARD, icon: <LayoutDashboard size={22} strokeWidth={1.25} /> },
        { name: 'Matches', path: APP_ROUTES.MANAGER_MATCHES, icon: <Trophy size={22} strokeWidth={1.25} /> }
      ]
    }
  ]

  return <DashboardLayout menuSections={menuSections} />
}
