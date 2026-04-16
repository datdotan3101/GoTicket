import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { approvalsService } from '../../services/approvalsService'
import { unwrapData } from '../../utils/apiData'

export default function ApprovalsPage() {
  const [type, setType] = useState('')
  const [items, setItems] = useState([])

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const response = await approvalsService.getPending(type ? { type } : undefined)
        setItems(unwrapData(response) || [])
      } catch {
        setItems([])
      }
    }

    fetchPending()
  }, [type])

  const refresh = async () => {
    try {
      const response = await approvalsService.getPending(type ? { type } : undefined)
      setItems(unwrapData(response) || [])
    } catch {
      setItems([])
    }
  }

  const onApprove = async (id) => {
    try {
      await approvalsService.approve(id)
      toast.success('Approved.')
      refresh()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Approve failed.')
    }
  }

  const onReject = async (id) => {
    const reason = window.prompt('Reason for rejection:')
    if (!reason) return
    try {
      await approvalsService.reject(id, reason)
      toast.success('Rejected.')
      refresh()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Reject failed.')
    }
  }

  return (
    <section className="container page">
      <h1>Approvals</h1>
      <div className="form">
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="">All</option>
          <option value="match">match</option>
          <option value="news">news</option>
          <option value="user_account">user_account</option>
        </select>
      </div>
      <div className="cards-grid">
        {items.map((item) => (
          <article className="card" key={item.id}>
            <h3>{item.resource_type} #{item.resource_id}</h3>
            <p>Submitted by: {item.submitted_by_name || item.submitted_by_email}</p>
            <p>Status: {item.status}</p>
            <div className="row-gap">
              <button type="button" onClick={() => onApprove(item.id)}>Approve</button>
              <button type="button" onClick={() => onReject(item.id)}>Reject</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
