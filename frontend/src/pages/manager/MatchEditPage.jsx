import { useEffect, useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import { useNavigate, useParams } from 'react-router-dom'
import { matchService } from '../../services/matchService'
import { clubService } from '../../services/clubService'
import { unwrapData } from '../../utils/apiData'
import Select from 'react-select'

export default function MatchEditPage() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [clubs, setClubs] = useState([])

  const clubOptions = useMemo(() => {
    return clubs
      .filter(c => form?.leagueId ? String(c.league_id) === String(form.leagueId) : false)
      .map(c => ({ value: c.name, label: c.name }));
  }, [clubs, form?.leagueId]);

  useEffect(() => {
    const load = async () => {
      try {
        const [response, clubsRes] = await Promise.all([
          matchService.getById(matchId),
          clubService.getAll({ limit: 200 })
        ])
        const match = unwrapData(response)
        const clubPayload = unwrapData(clubsRes)
        setClubs(clubPayload?.data || clubPayload || [])
        
        setForm({
          leagueId: match.league_id,
          homeTeam: match.home_team || '',
          awayTeam: match.away_team || '',
          matchDate: match.match_date ? String(match.match_date).slice(0, 16) : '',
          ticketSaleOpenAt: match.ticket_sale_open_at ? String(match.ticket_sale_open_at).slice(0, 16) : '',
          description: match.description || '',
        })
      } catch {
        setForm(null)
      }
    }
    load()
  }, [matchId])

  const onSubmit = async (event) => {
    event.preventDefault()
    try {
      await matchService.update(matchId, { ...form })
      toast.success('Match updated.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed.')
    }
  }

  const onSubmitReview = async () => {
    try {
      await matchService.submit(matchId)
      toast.success('Submitted for approval.')
      navigate('/manager')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submit failed.')
    }
  }

  if (!form) return <section className="container page"><p>Cannot load match.</p></section>

  return (
    <section className="container page">
      <h1>Edit Match</h1>
      <form className="form" onSubmit={onSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <Select
            options={clubOptions}
            value={clubOptions.find(o => o.value === form.homeTeam) || null}
            onChange={(selected) => setForm((p) => ({ ...p, homeTeam: selected ? selected.value : '' }))}
            placeholder="Select home team"
            isSearchable
            noOptionsMessage={() => form?.leagueId ? "No teams found" : "Please select a league first"}
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <Select
            options={clubOptions}
            value={clubOptions.find(o => o.value === form.awayTeam) || null}
            onChange={(selected) => setForm((p) => ({ ...p, awayTeam: selected ? selected.value : '' }))}
            placeholder="Select away team"
            isSearchable
            noOptionsMessage={() => form?.leagueId ? "No teams found" : "Please select a league first"}
          />
        </div>
        <input type="datetime-local" value={form.matchDate} onChange={(e) => setForm((p) => ({ ...p, matchDate: e.target.value }))} required />
        <input type="datetime-local" value={form.ticketSaleOpenAt} onChange={(e) => setForm((p) => ({ ...p, ticketSaleOpenAt: e.target.value }))} />
        <textarea rows={6} placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
        <div className="row-gap">
          <button type="submit">Save</button>
          <button type="button" onClick={onSubmitReview}>Submit review</button>
        </div>
      </form>
    </section>
  )
}
