import { useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useState, useEffect } from 'react'
import { APP_ROUTES } from '../../../constants/routes'
import { ROLES } from '../../../constants/roles'
import { userService } from '../../../services/userService'
import { approvalsService } from '../../../services/approvalsService'
import { clubService } from '../../../services/clubService'
import { unwrapData } from '../../../utils/apiData'
import { validateForm } from '../../../utils/validator'

const EMPTY_ADD_FORM = { fullName: '', email: '', password: '', role: ROLES.MANAGER, clubId: '' }
const EMPTY_EDIT_FORM = { id: null, fullName: '', email: '', role: '', clubId: '' }

export function useUsers() {
  const location = useLocation()
  const isManagerMode = location.pathname === APP_ROUTES.ADMIN_MANAGERS

  const [users, setUsers] = useState([])
  const [clubs, setClubs] = useState([])
  const [pendingMatches, setPendingMatches] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM)

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM)

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, user: null })

  /* ── Fetch ── */
  const refreshUsers = useCallback(async () => {
    try {
      const res = await userService.getAll({ limit: 100 })
      const payload = unwrapData(res)
      setUsers(payload?.data ?? payload ?? [])
    } catch { /* ignore */ }
  }, [])

  const refreshPending = useCallback(async () => {
    try {
      const res = await approvalsService.getPending({ type: 'match' })
      setPendingMatches(unwrapData(res) || [])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        const [usersRes, approvalsRes, clubsRes] = await Promise.all([
          userService.getAll({ limit: 100 }),
          approvalsService.getPending({ type: 'match' }),
          clubService.getAll({ limit: 100 }),
        ])
        const up = unwrapData(usersRes)
        setUsers(up?.data ?? up ?? [])
        setPendingMatches(unwrapData(approvalsRes) || [])
        const cp = unwrapData(clubsRes)
        setClubs(cp?.data ?? cp ?? [])
      } catch (err) { console.error(err) }
    }
    init()
  }, [])

  /* ── Toggle active ── */
  const toggleActive = async (user) => {
    try {
      await userService.setActive(user.id, !user.is_active)
      refreshUsers()
      toast.success(user.is_active ? 'Account locked successfully.' : 'Account unlocked successfully.')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cannot update active state.')
    }
  }

  const openConfirmModal = (user) => {
    if (user.is_active) setConfirmModal({ isOpen: true, user })
    else toggleActive(user)
  }

  /* ── Approvals ── */
  const handleApproveMatch = async (id) => {
    try {
      await approvalsService.approve(id)
      toast.success('Approved.')
      refreshPending()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Approve failed.')
    }
  }

  const handleRejectMatch = async (id) => {
    const reason = window.prompt('Enter rejection reason:')
    if (!reason) return
    try {
      await approvalsService.reject(id, reason)
      toast.success('Rejected.')
      refreshPending()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Reject failed.')
    }
  }

  /* ── Add user ── */
  const handleAddUser = async (e) => {
    e.preventDefault()
    const schema = {
      fullName: { required: 'Full Name is required', maxLength: { value: 255, message: 'Full Name exceeds 255 characters' } },
      email: { required: 'Email is required', regex: { pattern: /\S+@\S+\.\S+/, message: 'Invalid email format' } },
      password: { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' }, maxLength: { value: 100, message: 'Password exceeds 100 characters' } },
      clubId: { custom: (val) => (addForm.role === ROLES.MANAGER && !val) ? 'Please assign a club for Manager role' : null },
    }
    if (!validateForm(addForm, schema)) return
    try {
      await userService.create(addForm)
      toast.success('User created successfully.')
      setIsAddOpen(false)
      setAddForm(EMPTY_ADD_FORM)
      refreshUsers()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create user.')
    }
  }

  /* ── Edit user ── */
  const openEdit = (user) => {
    setEditForm({ id: user.id, fullName: user.full_name || '', email: user.email || '', role: user.role || ROLES.MANAGER, clubId: user.club_id || '' })
    setIsEditOpen(true)
  }

  const handleEditUser = async (e) => {
    e.preventDefault()
    const schema = {
      fullName: { required: 'Full Name is required', maxLength: { value: 255, message: 'Full Name exceeds 255 characters' } },
      email: { required: 'Email is required', regex: { pattern: /\S+@\S+\.\S+/, message: 'Invalid email format' } },
      clubId: { custom: (val) => (editForm.role === ROLES.MANAGER && !val) ? 'Please assign a club for Manager role' : null },
    }
    if (!validateForm(editForm, schema)) return
    try {
      await userService.update(editForm.id, editForm)
      toast.success('User updated successfully.')
      setIsEditOpen(false)
      refreshUsers()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update user.')
    }
  }

  /* ── Filtered list ── */
  const displayUsers = users.filter((u) => {
    const userRole = u.role?.toLowerCase()
    const matchesRoleFilter = roleFilter === 'all' || userRole === roleFilter.toLowerCase()
    if (isManagerMode) {
      return matchesRoleFilter && [ROLES.MANAGER, ROLES.ADMIN, ROLES.EDITOR, ROLES.CHECKER].includes(userRole)
    }
    return userRole === ROLES.AUDIENCE || !u.role
  })

  const filteredUsers = displayUsers.filter((u) =>
    (u.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  return {
    isManagerMode,
    users, clubs, pendingMatches,
    displayUsers, filteredUsers,
    searchTerm, setSearchTerm,
    roleFilter, setRoleFilter,
    // add
    isAddOpen, setIsAddOpen, addForm, setAddForm, handleAddUser,
    // edit
    isEditOpen, setIsEditOpen, editForm, setEditForm, openEdit, handleEditUser,
    // confirm
    confirmModal, setConfirmModal, openConfirmModal, toggleActive,
    // approvals
    handleApproveMatch, handleRejectMatch,
  }
}
