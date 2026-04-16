import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { leagueService } from '../../services/leagueService'
import { matchService } from '../../services/matchService'
import { stadiumService } from '../../services/stadiumService'
import { unwrapData } from '../../utils/apiData'
import { STAND_NAMES } from '../../constants/standRatios'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { format } from 'date-fns'
const initialForm = {
  homeTeam: '',
  awayTeam: '',
  matchDate: '',
  stadiumId: '',
  leagueId: '',
  description: '',
}

const initialStandConfig = {
  totalCapacity: '',
  prices: { A: '', B: '', C: '', D: '' }
}

export default function MatchCreatePage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initialForm)
  const [standConfig, setStandConfig] = useState(initialStandConfig)
  const [stadiums, setStadiums] = useState([])
  const [leagues, setLeagues] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
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

  const nextStep = () => setStep((s) => s + 1)
  const prevStep = () => setStep((s) => s - 1)

  const handleCreate = async () => {
    setIsSubmitting(true)
    try {
      // Step 1: Create Match
      const basicPayload = {
        ...form,
        stadiumId: Number(form.stadiumId),
        leagueId: Number(form.leagueId),
      }
      const matchRes = await matchService.create(basicPayload)
      const createdMatch = unwrapData(matchRes)
      const matchId = createdMatch.id

      // Step 2: Configure Stands
      const standsPayload = {
        totalCapacity: Number(standConfig.totalCapacity),
        prices: {
          A: Number(standConfig.prices.A),
          B: Number(standConfig.prices.B),
          C: Number(standConfig.prices.C),
          D: Number(standConfig.prices.D),
        }
      }
      await matchService.configureStands(matchId, standsPayload)

      // Step 3: Submit for Approval
      await matchService.submit(matchId)

      toast.success('Match created and sent for approval!')
      navigate('/manager')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Creation workflow failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="manager-create-page container">
      <div className="mc-header-section">
        <div className="mc-header-left">
          <h1>Create New Match</h1>
          <p className="mc-subtitle">Define the core parameters for the upcoming fixture.<br/>Ensure all details are accurate for schedule synchronization.</p>
        </div>
        <div className="mc-system-status">
          <span className="dot"></span> SYSTEM ONLINE
        </div>
      </div>

      <div className="mc-stepper">
        <div className={`mc-step ${step >= 1 ? 'active' : ''}`}>
          <div className="mc-step-meta">
            <span className="mc-step-label">STEP 01</span>
            <div className="mc-step-bar"></div>
          </div>
          <div className="mc-step-title">Basic Info</div>
        </div>
        <div className={`mc-step ${step >= 2 ? 'active' : ''}`}>
          <div className="mc-step-meta">
            <span className="mc-step-label">STEP 02</span>
            <div className="mc-step-bar"></div>
          </div>
          <div className="mc-step-title">Setup Price</div>
        </div>
        <div className={`mc-step ${step >= 3 ? 'active' : ''}`}>
          <div className="mc-step-meta">
            <span className="mc-step-label">STEP 03</span>
            <div className="mc-step-bar"></div>
          </div>
          <div className="mc-step-title">Review</div>
        </div>
      </div>

      <div className="mc-step-content">
        {step === 1 && (
          <div className="mc-form-step">
            <div className="mc-section-title">MATCH THUMBNAIL & TEAMS</div>
            <div className="mc-detail-card" style={{ marginBottom: '30px' }}>
              <div className="mc-input-group" style={{ marginBottom: '20px' }}>
                <label>UPLOAD MATCH THUMBNAIL</label>
                <div style={{ position: 'relative', border: '2px dashed #cbd5e1', padding: previewUrl ? '0' : '40px', borderRadius: '12px', textAlign: 'center', backgroundColor: '#f8fafc', cursor: 'pointer', transition: 'all 0.2s', overflow: 'hidden', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseOver={(e) => e.currentTarget.style.borderColor = '#6366f1'} onMouseOut={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}>
                  {previewUrl ? (
                    <img src={previewUrl} alt="Thumbnail preview" style={{ width: '100%', maxHeight: '400px', height: 'auto', objectFit: 'contain', backgroundColor: '#f1f5f9' }} />
                  ) : (
                    <div>
                      <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📸</div>
                      <div style={{ fontWeight: 700, color: '#475569' }}>Click to browse or drag and drop image</div>
                    </div>
                  )}
                  <input type="file" accept="image/*" style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }} onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setPreviewUrl(URL.createObjectURL(file));
                    }
                  }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', marginBottom: '8px', letterSpacing: '1px' }}>HOME TEAM</label>
                  <input className="mc-nice-input" placeholder="Home team name" value={form.homeTeam} onChange={(e) => setForm(p => ({...p, homeTeam: e.target.value}))} />
                </div>
                <div style={{ fontWeight: 900, color: '#94a3b8', marginTop: '16px' }}>VS</div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', marginBottom: '8px', letterSpacing: '1px' }}>AWAY TEAM</label>
                  <input className="mc-nice-input" placeholder="Away team name" value={form.awayTeam} onChange={(e) => setForm(p => ({...p, awayTeam: e.target.value}))} />
                </div>
              </div>
            </div>

            <div className="mc-details-grid">
              <div className="mc-detail-card">
                <div className="mc-card-header">
                  <span className="mc-icon">📅</span> Schedule Details
                </div>
                <div className="mc-input-group">
                  <label>MATCH DATE & TIME</label>
                  <DatePicker
                    selected={form.matchDate ? new Date(form.matchDate) : null}
                    onChange={(date) => setForm(p => ({...p, matchDate: date ? date.toISOString() : ''}))}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="dd/MM/yyyy HH:mm"
                    timeCaption="Time"
                    className="mc-nice-input w-full"
                    wrapperClassName="w-full !block"
                    placeholderText="Select Date & Time"
                  />
                </div>
              </div>

              <div className="mc-detail-card">
                <div className="mc-card-header">
                  <span className="mc-icon">🏟️</span> Venue Information
                </div>
                <div className="mc-input-group">
                  <label>STADIUM NAME</label>
                  <select className="mc-nice-input" value={form.stadiumId} onChange={(e) => setForm(p => ({...p, stadiumId: e.target.value}))}>
                    <option value="">🔍 Search stadium...</option>
                    {stadiums.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                  <div className="mc-stadium-loc">📍 Select a stadium to view location</div>
                </div>
              </div>
            </div>

            <div className="mc-detail-card">
              <div className="mc-card-header">
                <span className="mc-icon">🏆</span> Match Configuration
              </div>
              <div className="mc-input-group">
                <label>SELECT LEAGUE COMPETITION</label>
                <select className="mc-nice-input" value={form.leagueId} onChange={(e)=>setForm(p=>({...p, leagueId: e.target.value}))}>
                  <option value="" disabled>Select League Competition...</option>
                  {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mc-form-step">
            <div className="mc-section-title">STAND CAPACITIES & PRICING</div>
            <div className="mc-pricing-grid">
              <div className="mc-pricing-card full">
                <label>Total Stadium Capacity</label>
                <input type="number" min="100" className="mc-nice-input" placeholder="e.g. 50000" value={standConfig.totalCapacity} onChange={(e) => setStandConfig(p => ({...p, totalCapacity: e.target.value}))} />
              </div>
              {STAND_NAMES.map((name) => (
                <div key={name} className="mc-pricing-card">
                  <label>Stand {name} Price (VND)</label>
                  <input type="number" min="0" className="mc-nice-input" placeholder={`Price for Stand ${name}`} value={standConfig.prices[name]} onChange={(e) => setStandConfig(p => ({...p, prices: {...p.prices, [name]: e.target.value}}))} />
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mc-form-step">
            <div className="mc-section-title">REVIEW & CONFIRM</div>
            <div className="mc-review-summary">
              <div className="mc-review-block">
                <h3>Match Details</h3>
                <p><strong>Match:</strong> {form.homeTeam || 'TBA'} vs {form.awayTeam || 'TBA'}</p>
                <p><strong>Time:</strong> {form.matchDate ? format(new Date(form.matchDate), 'dd/MM/yyyy HH:mm') : 'TBA'}</p>
              </div>
              <div className="mc-review-block">
                <h3>Capacity & Pricing</h3>
                <p><strong>Total Capacity:</strong> {standConfig.totalCapacity || '0'}</p>
                <p><strong>Stand A:</strong> {standConfig.prices.A || '0'} VND | <strong>Stand B:</strong> {standConfig.prices.B || '0'} VND</p>
                <p><strong>Stand C:</strong> {standConfig.prices.C || '0'} VND | <strong>Stand D:</strong> {standConfig.prices.D || '0'} VND</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mc-form-footer">
        <button className="mc-btn mc-btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
        <div className="mc-footer-right">
          {step > 1 && <button className="mc-btn mc-btn-secondary" onClick={prevStep}>Back</button>}
          {step < 3 && <button className="mc-btn mc-btn-primary" onClick={nextStep}>Next Step ➔</button>}
          {step === 3 && (
            <button className="mc-btn mc-btn-primary" onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Confirm & Submit to Admin'}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
