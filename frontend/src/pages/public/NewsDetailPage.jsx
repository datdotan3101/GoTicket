import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { newsService } from '../../services/newsService'
import { unwrapData } from '../../utils/apiData'

export default function NewsDetailPage() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await newsService.getBySlug(slug)
        setArticle(unwrapData(response))
      } catch {
        setArticle(null)
      }
    }

    fetchArticle()
  }, [slug])

  if (!article) return <section className="container page"><p>News not found.</p></section>

  return (
    <section className="container page">
      <h1>{article.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: article.content || '<p>No content</p>' }} />
    </section>
  )
}
