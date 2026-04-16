import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { APP_ROUTES } from '../../constants/routes'
import { NEWS_STATUS_OPTIONS } from '../../constants/newsStatus'
import { newsService } from '../../services/newsService'
import { unwrapData } from '../../utils/apiData'

export default function EditorDashboard() {
  const [status, setStatus] = useState('')
  const [articles, setArticles] = useState([])

  useEffect(() => {
    const fetchMyNews = async () => {
      try {
        const response = await newsService.getMyNews(status ? { status } : undefined)
        const payload = unwrapData(response)
        setArticles(payload?.data ?? payload ?? [])
      } catch {
        setArticles([])
      }
    }

    fetchMyNews()
  }, [status])

  const submitReview = async (id) => {
    await newsService.submit(id)
    try {
      const response = await newsService.getMyNews(status ? { status } : undefined)
      const payload = unwrapData(response)
      setArticles(payload?.data ?? payload ?? [])
    } catch {
      setArticles([])
    }
  }

  return (
    <section className="container page">
      <h1>Editor Dashboard</h1>
      <div className="row-gap">
        <Link className="link-button" to={APP_ROUTES.EDITOR_NEWS_CREATE}>Create news</Link>
        <Link className="link-button" to={APP_ROUTES.EDITOR_NOTIFICATIONS}>Notifications</Link>
      </div>

      <div className="form" style={{ marginTop: '12px' }}>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All status</option>
          {NEWS_STATUS_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      <div className="cards-grid">
        {articles.map((item) => (
          <article key={item.id} className="card">
            <h3>{item.title}</h3>
            <p>Status: {item.status}</p>
            <p>Sport: {item.sport_name || '--'}</p>
            <div className="row-gap">
              <Link className="link-button" to={`/editor/news/${item.id}/edit`}>Edit</Link>
              <button type="button" onClick={() => submitReview(item.id)}>Submit review</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
