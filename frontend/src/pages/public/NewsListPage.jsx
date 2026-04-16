import { useEffect, useState } from 'react'
import NewsCard from '../../components/ui/NewsCard'
import { newsService } from '../../services/newsService'
import { unwrapData } from '../../utils/apiData'

export default function NewsListPage() {
  const [news, setNews] = useState([])

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await newsService.getAll({ limit: 12 })
        const payload = unwrapData(response)
        setNews(payload?.data ?? payload ?? [])
      } catch {
        setNews([])
      }
    }

    fetchNews()
  }, [])

  return (
    <section className="container page">
      <h1>News</h1>
      <div className="cards-grid">
        {news.map((item) => <NewsCard key={item.id} item={item} />)}
      </div>
    </section>
  )
}
