import { useAuth } from '../../hooks/useAuth'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <section className="container page">
      <h1>Dashboard</h1>
      <p>Welcome {user?.full_name ?? user?.email}. Role: {user?.role}</p>
      <p>Role-specific dashboards will be delivered in next phases.</p>
    </section>
  )
}
