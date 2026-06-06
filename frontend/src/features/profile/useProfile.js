import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services/authService'
import { uploadService } from '../../services/uploadService'
import { APP_ROUTES } from '../../constants/routes'
import { validateForm } from '../../utils/validator'
import { profileUpdateSchema, passwordChangeSchema } from '../../validations/profile.validation'

export function useProfile() {
  const navigate = useNavigate()
  const { user, setUser, logout } = useAuthStore()
  const hasPassword = user?.hasPassword !== false
  const fileInputRef = useRef(null)

  /* ── Profile ── */
  const [profileForm, setProfileForm] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
  })
  const [profileLoading, setProfileLoading] = useState(false)

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    const valid = validateForm({ fullName: profileForm.fullName }, profileUpdateSchema)
    if (!valid) return
    try {
      setProfileLoading(true)
      const res = await authService.updateProfile({
        fullName: profileForm.fullName.trim(),
        email: profileForm.email.trim(),
      })
      setUser(res.data.data)
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'An error occurred.')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setProfileLoading(true)
      const uploadRes = await uploadService.uploadFile(file)
      const avatarUrl = uploadRes.data.url
      const res = await authService.updateProfile({
        fullName: profileForm.fullName.trim() || user.full_name,
        email: profileForm.email.trim() || user.email,
        avatarUrl,
      })
      setUser(res.data.data)
      toast.success('Avatar updated successfully!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cannot upload avatar.')
    } finally {
      setProfileLoading(false)
    }
  }

  /* ── Password ── */
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwLoading, setPwLoading] = useState(false)

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm(pwForm, passwordChangeSchema)) return
    try {
      setPwLoading(true)
      await authService.changePassword({
        currentPassword: hasPassword ? pwForm.currentPassword : '',
        newPassword: pwForm.newPassword,
      })
      setUser({ ...user, hasPassword: true })
      toast.success(hasPassword ? 'Password changed successfully!' : 'Password set successfully!')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'An error occurred.')
    } finally {
      setPwLoading(false)
    }
  }

  /* ── Delete Account ── */
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const confirmDeleteAccount = async () => {
    try {
      setDeleteLoading(true)
      await authService.deleteAccount()
      logout()
      navigate(APP_ROUTES.HOME)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cannot delete account at this time.')
      setDeleteLoading(false)
      setShowDeleteModal(false)
      setDeleteConfirmText('')
    }
  }

  return {
    user,
    hasPassword,
    fileInputRef,
    // profile
    profileForm, setProfileForm, profileLoading,
    handleProfileSubmit, handleAvatarChange,
    // password
    pwForm, setPwForm, pwLoading,
    handlePasswordSubmit,
    // delete
    showDeleteModal, setShowDeleteModal,
    deleteLoading,
    deleteConfirmText, setDeleteConfirmText,
    confirmDeleteAccount,
  }
}
