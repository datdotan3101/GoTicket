import { Link } from 'react-router-dom'

export default function NewsCard({ item }) {
  return (
    <article className="card">
      <h3>{item.title}</h3>
      <p>{item.slug}</p>
      <Link className="link-button" to={`/news/${item.slug}`}>Read</Link>
    </article>
  )
}
