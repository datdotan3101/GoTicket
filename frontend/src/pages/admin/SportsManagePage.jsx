import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { sportService } from '../../services/sportService'
import { unwrapData } from '../../utils/apiData'

export default function SportsManagePage() {
  const [sports, setSports] = useState([])
  const [form, setForm] = useState({ name: '', slug: '', bannerUrl: '' })

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

  const refresh = async () => {
    try {
      const response = await sportService.getAll()
      setSports(unwrapData(response) || [])
    } catch {
      setSports([])
    }
  }

  const createSport = async (event) => {
    event.preventDefault()
    try {
      await sportService.create(form)
      setForm({ name: '', slug: '', bannerUrl: '' })
      refresh()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Create sport failed.')
    }
  }

  const deleteSport = async (id) => {
    await sportService.remove(id)
    refresh()
  }

  return (
    <section className="container page">
      <h1>Sports Management</h1>
      <form className="form" onSubmit={createSport}>
        <input placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
        <input placeholder="Slug" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} required />
        <input placeholder="Banner URL" value={form.bannerUrl} onChange={(e) => setForm((p) => ({ ...p, bannerUrl: e.target.value }))} />
        <button type="submit">Create sport</button>
      </form>
      <div className="cards-grid">
        {sports.map((sport) => (
          <article className="card" key={sport.id}>
            <h3>{sport.name}</h3>
            <p>Slug: {sport.slug}</p>
            <button type="button" onClick={() => deleteSport(sport.id)}>Delete</button>
          </article>
        ))}
      </div>
    </section>
  )
}
