import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import { APP_ROUTES } from '../../constants/routes'
import { newsService } from '../../services/newsService'
import { sportService } from '../../services/sportService'
import { unwrapData } from '../../utils/apiData'

export default function NewsEditPage() {
  const { newsId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [sports, setSports] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const [newsResponse, sportsResponse] = await Promise.all([
          newsService.getById(newsId),
          sportService.getAll(),
        ])
        const news = unwrapData(newsResponse)
        setForm({
          title: news.title || '',
          content: news.content || '',
          thumbnailUrl: news.thumbnail_url || '',
          sportId: news.sport_id || '',
          scheduledPublishAt: news.scheduled_publish_at ? String(news.scheduled_publish_at).slice(0, 16) : '',
        })
        setSports(unwrapData(sportsResponse) || [])
      } catch {
        setForm(null)
      }
    }

    load()
  }, [newsId])

  const onUpdate = async (event) => {
    event.preventDefault()
    try {
      await newsService.update(newsId, {
        ...form,
        sportId: form.sportId ? Number(form.sportId) : null,
        scheduledPublishAt: form.scheduledPublishAt || null,
      })
      toast.success('News updated.')
      navigate(APP_ROUTES.EDITOR_DASHBOARD)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed.')
    }
  }

  const onDelete = async () => {
    try {
      await newsService.remove(newsId)
      toast.success('News deleted.')
      navigate(APP_ROUTES.EDITOR_DASHBOARD)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed.')
    }
  }

  const onSubmitReview = async () => {
    try {
      await newsService.submit(newsId)
      toast.success('Submitted for review.')
      navigate(APP_ROUTES.EDITOR_DASHBOARD)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submit failed.')
    }
  }

  if (!form) return <section className="container page"><p>Cannot load article.</p></section>

  return (
    <section className="container page">
      <h1>Edit News</h1>
      <form className="form" onSubmit={onUpdate}>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
        <textarea rows={8} placeholder="HTML content" value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} required />
        <input placeholder="Thumbnail URL" value={form.thumbnailUrl} onChange={(e) => setForm((p) => ({ ...p, thumbnailUrl: e.target.value }))} />
        <select value={form.sportId} onChange={(e) => setForm((p) => ({ ...p, sportId: e.target.value }))}>
          <option value="">Select sport</option>
          {sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}
        </select>
        <input type="datetime-local" value={form.scheduledPublishAt} onChange={(e) => setForm((p) => ({ ...p, scheduledPublishAt: e.target.value }))} />
        <div className="row-gap">
          <button type="submit">Save changes</button>
          <button type="button" onClick={onDelete}>Delete draft</button>
          <button type="button" onClick={onSubmitReview}>Submit review</button>
        </div>
      </form>
    </section>
  )
}
