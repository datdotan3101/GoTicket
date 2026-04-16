import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { ROLES } from '../../constants/roles'
import { clubService } from '../../services/clubService'
import { userService } from '../../services/userService'
import { unwrapData } from '../../utils/apiData'

export default function UserManagePage() {
  const [users, setUsers] = useState([])
  const [clubs, setClubs] = useState([])

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [usersRes, clubsRes] = await Promise.all([
          userService.getAll({ limit: 100 }),
          clubService.getAll(),
        ])
        const usersPayload = unwrapData(usersRes)
        setUsers(usersPayload?.data ?? usersPayload ?? [])
        setClubs(unwrapData(clubsRes) || [])
      } catch {
        setUsers([])
        setClubs([])
      }
    }

    fetchInitial()
  }, [])

  const refreshUsers = async () => {
    try {
      const response = await userService.getAll({ limit: 100 })
      const payload = unwrapData(response)
      setUsers(payload?.data ?? payload ?? [])
    } catch {
      setUsers([])
    }
  }

  const toggleActive = async (user) => {
    try {
      await userService.setActive(user.id, !user.is_active)
      refreshUsers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cannot update active state.')
    }
  }

  const updateRole = async (user, role) => {
    try {
      let clubId = null
      if (role === ROLES.MANAGER) {
        const input = window.prompt('Enter club ID for manager role:')
        clubId = Number(input)
      }
      await userService.updateRole(user.id, role, clubId)
      refreshUsers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cannot update role.')
    }
  }

  return (
    <section className="container page">
      <h1>User Management</h1>
      <p>Available club IDs: {clubs.map((club) => club.id).join(', ') || '--'}</p>
      <div className="cards-grid">
        {users.map((user) => (
          <article className="card" key={user.id}>
            <h3>{user.full_name || user.email}</h3>
            <p>Email: {user.email}</p>
            <p>Role: {user.role}</p>
            <p>Active: {String(user.is_active)}</p>
            <div className="row-gap">
              <button type="button" onClick={() => toggleActive(user)}>
                {user.is_active ? 'Lock' : 'Unlock'}
              </button>
              <select defaultValue={user.role} onChange={(event) => updateRole(user, event.target.value)}>
                {Object.values(ROLES).map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
