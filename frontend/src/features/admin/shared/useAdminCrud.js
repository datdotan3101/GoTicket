/**
 * useAdminCrud — Generic CRUD hook for admin list pages.
 *
 * Encapsulates the common pattern:
 *   - items list state
 *   - loading / error state
 *   - fetch + refresh
 *   - add / edit modal open state
 *   - confirm modal state
 *
 * Usage:
 *   const crud = useAdminCrud({
 *     fetchFn: () => myService.getAll(),
 *     unwrap: (res) => res.data ?? res,
 *   })
 */
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import { unwrapData } from '../../../utils/apiData'

/**
 * @param {object} options
 * @param {() => Promise<any>} options.fetchFn  — async function that returns the API response
 * @param {(res: any) => any[]} [options.unwrap] — transform API response → array (default: unwrapData)
 * @param {string} [options.entityName]          — name shown in toast messages (e.g. 'user')
 */
export function useAdminCrud({ fetchFn, unwrap, entityName = 'item' }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  // Modal / form state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null, action: null })

  const resolve = unwrap ?? ((res) => {
    const d = unwrapData(res)
    return d?.data ?? d ?? []
  })

  const refresh = useCallback(async () => {
    try {
      const res = await fetchFn()
      setItems(resolve(res))
    } catch (err) {
      console.error(`[useAdminCrud] refresh failed for ${entityName}:`, err)
    }
  }, [fetchFn]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [refresh])

  /** Open the edit modal pre-filled with an item */
  const openEdit = (item) => {
    setEditingItem(item)
    setIsEditOpen(true)
  }

  /** Close both modals and clear editing state */
  const closeModals = () => {
    setIsAddOpen(false)
    setIsEditOpen(false)
    setEditingItem(null)
  }

  /** Show confirmation modal before a destructive action */
  const requestConfirm = (item, action) => {
    setConfirmModal({ isOpen: true, item, action })
  }

  const closeConfirm = () => {
    setConfirmModal({ isOpen: false, item: null, action: null })
  }

  /** Execute the confirmed action */
  const executeConfirm = async () => {
    if (!confirmModal.action) return
    try {
      await confirmModal.action(confirmModal.item)
      await refresh()
    } catch (err) {
      toast.error(err?.response?.data?.message || `Failed to update ${entityName}.`)
    } finally {
      closeConfirm()
    }
  }

  return {
    items, loading,
    refresh,
    // add
    isAddOpen, openAdd: () => setIsAddOpen(true), closeAdd: () => setIsAddOpen(false),
    // edit
    isEditOpen, editingItem, openEdit, closeEdit: () => { setIsEditOpen(false); setEditingItem(null) },
    // combined close
    closeModals,
    // confirm
    confirmModal, requestConfirm, closeConfirm, executeConfirm,
  }
}
