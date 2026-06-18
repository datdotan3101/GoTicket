import { useState, useEffect } from 'react'
import { X, Shield, FileText } from 'lucide-react'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { toast } from 'react-toastify'

export default function MatchEditModal({ 
  isOpen, 
  onClose, 
  match, 
  stadiums, 
  onUpdate, 
  onSubmitForReview 
}) {
  const [form, setForm] = useState({
    homeTeam: '',
    awayTeam: '',
    matchDate: null,
    ticketSaleOpenAt: null,
    stadiumId: '',
    description: ''
  })
  const [timeView, setTimeView] = useState({ matchDate: false, ticketSaleOpenAt: false })

  useEffect(() => {
    if (match) {
      // eslint-disable-next-line
      setForm({
        homeTeam: match.home_team || '',
        awayTeam: match.away_team || '',
        matchDate: match.match_date ? new Date(match.match_date) : null,
        ticketSaleOpenAt: match.ticket_sale_open_at ? new Date(match.ticket_sale_open_at) : null,
        stadiumId: match.stadium_id || '',
        description: match.description || ''
      })
    }
  }, [match])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const now = new Date()
    if (form.homeTeam && form.awayTeam && form.homeTeam.trim().toLowerCase() === form.awayTeam.trim().toLowerCase()) {
      toast.error('Home and Away teams must be different')
      return
    }
    if (form.matchDate && form.matchDate < now) {
      toast.error('Match date cannot be in the past')
      return
    }
    if (form.ticketSaleOpenAt && form.ticketSaleOpenAt < now) {
      toast.error('Ticket sale opening date cannot be in the past')
      return
    }
    if (form.ticketSaleOpenAt && form.matchDate && form.ticketSaleOpenAt >= form.matchDate) {
      toast.error('Ticket sale date must be before the match date')
      return
    }

    onUpdate({
      ...form,
      stadiumId: Number(form.stadiumId)
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Match Campaign</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="mc-details-grid">
              <div className="mc-input-group">
                <label>HOME TEAM</label>
                <input 
                  className="mc-nice-input" 
                  value={form.homeTeam} 
                  onChange={e => setForm(p => ({ ...p, homeTeam: e.target.value }))} 
                  required 
                />
              </div>
              <div className="mc-input-group">
                <label>AWAY TEAM</label>
                <input 
                  className="mc-nice-input" 
                  value={form.awayTeam} 
                  onChange={e => setForm(p => ({ ...p, awayTeam: e.target.value }))} 
                  required 
                />
              </div>
            </div>

            <div className="mc-details-grid">
              <div className="mc-input-group">
                <label>MATCH DATE & TIME</label>
                <DatePicker
                  selected={form.matchDate}
                  onCalendarOpen={() => setTimeView(p => ({...p, matchDate: false}))}
                  onChange={date => {
                    setTimeView(p => ({...p, matchDate: true}));
                    setForm(p => ({ ...p, matchDate: date }));
                  }}
                  minDate={new Date()}
                  shouldCloseOnSelect={false}
                  calendarClassName={timeView.matchDate ? "hide-calendar" : ""}
                  showTimeInput={timeView.matchDate}
                  timeInputLabel="Time:"
                  dateFormat="Pp"
                  className="mc-nice-input"
                  required
                >
                  {timeView.matchDate ? (
                    <div style={{ padding: '12px 16px', textAlign: 'center', borderTop: '1px solid var(--color-slate-100)', fontSize: '0.8rem', color: 'var(--color-slate-500)', fontWeight: '600', display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
                      <button type="button" className="btn-solid dark" onClick={(e) => { e.preventDefault(); setTimeView(p => ({...p, matchDate: false})); }} style={{ padding: '6px 12px', fontSize: '0.75rem', margin: 0 }}>Back to Date</button>
                      <div>Click outside to finish</div>
                    </div>
                  ) : (
                    <div style={{ padding: '10px', textAlign: 'center', borderTop: '1px solid var(--color-slate-100)', fontSize: '0.8rem', color: 'var(--color-slate-500)', fontWeight: '600' }}>
                      Select a date to continue
                    </div>
                  )}
                </DatePicker>
              </div>
              <div className="mc-input-group">
                <label>TICKET SALE START</label>
                <DatePicker
                  selected={form.ticketSaleOpenAt}
                  onCalendarOpen={() => setTimeView(p => ({...p, ticketSaleOpenAt: false}))}
                  onChange={date => {
                    setTimeView(p => ({...p, ticketSaleOpenAt: true}));
                    setForm(p => ({ ...p, ticketSaleOpenAt: date }));
                  }}
                  minDate={new Date()}
                  shouldCloseOnSelect={false}
                  calendarClassName={timeView.ticketSaleOpenAt ? "hide-calendar" : ""}
                  showTimeInput={timeView.ticketSaleOpenAt}
                  timeInputLabel="Time:"
                  dateFormat="Pp"
                  className="mc-nice-input"
                >
                  {timeView.ticketSaleOpenAt ? (
                    <div style={{ padding: '12px 16px', textAlign: 'center', borderTop: '1px solid var(--color-slate-100)', fontSize: '0.8rem', color: 'var(--color-slate-500)', fontWeight: '600', display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
                      <button type="button" className="btn-solid dark" onClick={(e) => { e.preventDefault(); setTimeView(p => ({...p, ticketSaleOpenAt: false})); }} style={{ padding: '6px 12px', fontSize: '0.75rem', margin: 0 }}>Back to Date</button>
                      <div>Click outside to finish</div>
                    </div>
                  ) : (
                    <div style={{ padding: '10px', textAlign: 'center', borderTop: '1px solid var(--color-slate-100)', fontSize: '0.8rem', color: 'var(--color-slate-500)', fontWeight: '600' }}>
                      Select a date to continue
                    </div>
                  )}
                </DatePicker>
              </div>
            </div>

            <div className="mc-input-group" style={{ marginBottom: '20px' }}>
              <label>STADIUM VENUE</label>
              <select 
                className="mc-nice-input" 
                value={form.stadiumId} 
                onChange={e => setForm(p => ({ ...p, stadiumId: e.target.value }))}
                required
              >
                <option value="">Select stadium</option>
                {stadiums.map(s => (
                  <option key={s.id} value={s.id}>{s.name} - {s.city}</option>
                ))}
              </select>
            </div>

            <div className="mc-input-group">
              <label>MATCH DESCRIPTION</label>
              <textarea 
                className="mc-nice-input" 
                rows={4} 
                value={form.description} 
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>
          <div className="modal-footer">
            <div style={{ marginRight: 'auto' }}>
              {match?.status === 'draft' && onSubmitForReview && (
                <button type="button" className="mc-btn mc-btn-secondary" onClick={() => onSubmitForReview(match.match_id)}>
                  <Shield size={16} style={{ marginRight: '8px' }} />
                  Submit for Review
                </button>
              )}
            </div>
            <button type="button" className="mc-btn mc-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="mc-btn mc-btn-primary">
              <FileText size={16} style={{ marginRight: '8px' }} />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
