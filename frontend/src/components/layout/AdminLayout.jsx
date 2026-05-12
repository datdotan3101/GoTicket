import { Outlet } from 'react-router-dom'
import AdminNavbar from './AdminNavbar'

export default function AdminLayout() {
  return (
    <div className="admin-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <AdminNavbar />
      <div style={{ flex: 1, backgroundColor: '#f9fafb', padding: '24px', overflowY: 'auto' }}>
        <Outlet />
      </div>
    </div>
  )
}
