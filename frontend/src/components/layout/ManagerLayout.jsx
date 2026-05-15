import { Outlet } from 'react-router-dom'
import ManagerNavbar from './ManagerNavbar'

export default function ManagerLayout() {
  return (
    <div className="manager-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <ManagerNavbar />
      <div style={{ flex: 1, backgroundColor: '#f9fafb', padding: '24px', overflowY: 'auto' }}>
        <Outlet />
      </div>
    </div>
  )
}
