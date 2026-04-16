import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import { matchService } from '../../services/matchService'
import { unwrapData } from '../../utils/apiData'

export default function MatchEditPage() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await matchService.getById(matchId)
        const match = unwrapData(response)
        setForm({
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
        <input placeholder="Home team" value={form.homeTeam} onChange={(e) => setForm((p) => ({ ...p, homeTeam: e.target.value }))} required />
        <input placeholder="Away team" value={form.awayTeam} onChange={(e) => setForm((p) => ({ ...p, awayTeam: e.target.value }))} required />
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
