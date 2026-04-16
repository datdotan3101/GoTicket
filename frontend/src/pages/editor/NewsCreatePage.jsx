import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { APP_ROUTES } from '../../constants/routes'
import { newsService } from '../../services/newsService'
import { sportService } from '../../services/sportService'
import { unwrapData } from '../../utils/apiData'

const initialForm = {
  title: '',
  content: '',
  thumbnailUrl: '',
  sportId: '',
  scheduledPublishAt: '',
}

export default function NewsCreatePage() {
  const [form, setForm] = useState(initialForm)
  const [sports, setSports] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const response = await sportService.getAll()
        setSports(unwrapData(response) || [])
      } catch {
        setSports([])
      }
    }

    fetchSports()
  }, [])

  const onSubmit = async (event) => {
    event.preventDefault()
    try {
      await newsService.create({
        ...form,
        sportId: form.sportId ? Number(form.sportId) : null,
        scheduledPublishAt: form.scheduledPublishAt || null,
      })
      toast.success('News created.')
      navigate(APP_ROUTES.EDITOR_DASHBOARD)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Create failed.')
    }
  }

  return (
    <section className="container page">
      <h1>Create News</h1>
      <form className="form" onSubmit={onSubmit}>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
        <textarea rows={8} placeholder="HTML content (TipTap output)" value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} required />
        <input placeholder="Thumbnail URL (Cloudinary)" value={form.thumbnailUrl} onChange={(e) => setForm((p) => ({ ...p, thumbnailUrl: e.target.value }))} />
        <select value={form.sportId} onChange={(e) => setForm((p) => ({ ...p, sportId: e.target.value }))}>
          <option value="">Select sport</option>
          {sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}
        </select>
        <input type="datetime-local" value={form.scheduledPublishAt} onChange={(e) => setForm((p) => ({ ...p, scheduledPublishAt: e.target.value }))} />
        <button type="submit">Create draft</button>
      </form>
    </section>
  )
}
