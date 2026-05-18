import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function DashboardLayout({ menuSections }) {
  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <Sidebar menuSections={menuSections} />
      <div style={{ flex: 1, backgroundColor: '#f9fafb', padding: '24px', overflowY: 'auto' }}>
        <Outlet />
      </div>
    </div>
  )
}
