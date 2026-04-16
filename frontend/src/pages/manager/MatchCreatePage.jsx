import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { leagueService } from '../../services/leagueService'
import { matchService } from '../../services/matchService'
import { stadiumService } from '../../services/stadiumService'
import { unwrapData } from '../../utils/apiData'

const initialForm = {
  homeTeam: '',
  awayTeam: '',
  matchDate: '',
  stadiumId: '',
  leagueId: '',
  ticketSaleOpenAt: '',
  description: '',
}

export default function MatchCreatePage() {
  const [form, setForm] = useState(initialForm)
  const [stadiums, setStadiums] = useState([])
  const [leagues, setLeagues] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const [stadiumsRes, leaguesRes] = await Promise.all([
          stadiumService.getAll(),
          leagueService.getAll(),
        ])
        setStadiums(unwrapData(stadiumsRes) || [])
        const leaguePayload = unwrapData(leaguesRes)
        setLeagues(leaguePayload?.data || leaguePayload || [])
      } catch {
        setStadiums([])
        setLeagues([])
      }
    }

    load()
  }, [])

  const onSubmit = async (event) => {
    event.preventDefault()
    try {
      const response = await matchService.create({
        ...form,
        stadiumId: Number(form.stadiumId),
        leagueId: Number(form.leagueId),
        ticketSaleOpenAt: form.ticketSaleOpenAt || null,
      })
      const created = unwrapData(response)
      toast.success('Match created.')
      navigate(`/manager/matches/${created.id}/stand-config`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Create match failed.')
    }
  }

  return (
    <section className="container page">
      <h1>Create Match</h1>
      <form className="form" onSubmit={onSubmit}>
        <input placeholder="Home team" value={form.homeTeam} onChange={(e) => setForm((p) => ({ ...p, homeTeam: e.target.value }))} required />
        <input placeholder="Away team" value={form.awayTeam} onChange={(e) => setForm((p) => ({ ...p, awayTeam: e.target.value }))} required />
        <input type="datetime-local" value={form.matchDate} onChange={(e) => setForm((p) => ({ ...p, matchDate: e.target.value }))} required />
        <select value={form.stadiumId} onChange={(e) => setForm((p) => ({ ...p, stadiumId: e.target.value }))} required>
          <option value="">Select stadium</option>
          {stadiums.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select value={form.leagueId} onChange={(e) => setForm((p) => ({ ...p, leagueId: e.target.value }))} required>
          <option value="">Select league</option>
          {leagues.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <input type="datetime-local" value={form.ticketSaleOpenAt} onChange={(e) => setForm((p) => ({ ...p, ticketSaleOpenAt: e.target.value }))} />
        <textarea rows={6} placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
        <button type="submit">Create draft match</button>
      </form>
    </section>
  )
}
