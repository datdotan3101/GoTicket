import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { leagueService } from '../../services/leagueService'
import { sportService } from '../../services/sportService'
import { unwrapData } from '../../utils/apiData'

export default function LeagueManagePage() {
  const [leagues, setLeagues] = useState([])
  const [sports, setSports] = useState([])
  const [form, setForm] = useState({ name: '', sportId: '', season: '', logoUrl: '' })

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [leaguesRes, sportsRes] = await Promise.all([
          leagueService.getAll({ limit: 100 }),
          sportService.getAll(),
        ])
        const leaguesPayload = unwrapData(leaguesRes)
        setLeagues(leaguesPayload?.data || leaguesPayload || [])
        setSports(unwrapData(sportsRes) || [])
      } catch {
        setLeagues([])
        setSports([])
      }
    }

    fetchAll()
  }, [])

  const refresh = async () => {
    try {
      const [leaguesRes, sportsRes] = await Promise.all([
        leagueService.getAll({ limit: 100 }),
        sportService.getAll(),
      ])
      const leaguesPayload = unwrapData(leaguesRes)
      setLeagues(leaguesPayload?.data || leaguesPayload || [])
      setSports(unwrapData(sportsRes) || [])
    } catch {
      setLeagues([])
      setSports([])
    }
  }

  const createLeague = async (event) => {
    event.preventDefault()
    try {
      await leagueService.create({ ...form, sportId: Number(form.sportId) })
      setForm({ name: '', sportId: '', season: '', logoUrl: '' })
      refresh()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Create league failed.')
    }
  }

  return (
    <section className="container page">
      <h1>League Management</h1>
      <form className="form" onSubmit={createLeague}>
        <input placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
        <select value={form.sportId} onChange={(e) => setForm((p) => ({ ...p, sportId: e.target.value }))} required>
          <option value="">Select sport</option>
          {sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}
        </select>
        <input placeholder="Season" value={form.season} onChange={(e) => setForm((p) => ({ ...p, season: e.target.value }))} />
        <input placeholder="Logo URL" value={form.logoUrl} onChange={(e) => setForm((p) => ({ ...p, logoUrl: e.target.value }))} />
        <button type="submit">Create league</button>
      </form>
      <div className="cards-grid">
        {leagues.map((league) => (
          <article className="card" key={league.id}>
            <h3>{league.name}</h3>
            <p>Season: {league.season || '--'}</p>
            <p>Sport: {league.sport_name || league.sport_id}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
