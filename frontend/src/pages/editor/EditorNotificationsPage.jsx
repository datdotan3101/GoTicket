import { useEffect, useState } from 'react'
import { notificationService } from '../../services/notificationService'
import { unwrapData } from '../../utils/apiData'

export default function EditorNotificationsPage() {
  const [items, setItems] = useState([])

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await notificationService.getAll()
        setItems(unwrapData(response) || [])
      } catch {
        setItems([])
      }
    }

    fetchItems()
  }, [])

  const markRead = async (id) => {
    await notificationService.markRead(id)
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)))
  }

  return (
    <section className="container page">
      <h1>Editor Notifications</h1>
      <div className="cards-grid">
        {items.map((item) => (
          <article key={item.id} className="card">
            <h3>{item.title}</h3>
            <p>{item.body || '--'}</p>
            <p>Type: {item.type || '--'} | Read: {item.is_read ? 'yes' : 'no'}</p>
            {!item.is_read && <button type="button" onClick={() => markRead(item.id)}>Mark read</button>}
          </article>
        ))}
      </div>
    </section>
  )
}
