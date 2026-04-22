import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save, Eye, Layout, ShieldCheck } from 'lucide-react'
import { STAND_NAMES } from '../../constants/standRatios'
import { matchService } from '../../services/matchService'
import { generateStandsPreview } from '../../utils/standGenerator'

const StandSectorGrid = ({ standName, totalSeats, prefix, rows, cols }) => {
  const blocks = rows * cols
  if (blocks === 0) return null
  const seatsPerBlock = Math.floor(totalSeats / blocks)
  const remainder = totalSeats % blocks
  
  const cells = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const num = r * cols + c + 1
      cells.push({
        id: `${prefix}${num}`,
        seats: seatsPerBlock + (num <= remainder ? 1 : 0)
      })
    }
  }

  return (
    <div className={`stand-sector-wrapper stand-${standName.toLowerCase()}`}>
      <div className="stand-sector-title">STAND {standName} - {totalSeats} Seats</div>
      <div className="stand-sector-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cells.map(cell => (
          <div key={cell.id} className="sector-cell">
            <span className="sector-id">{cell.id}</span>
            <span className="sector-seats">{cell.seats}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const StadiumMap = ({ stands }) => {
  const getStandData = (name) => stands.find(s => s.name === name) || { total_seats: 0 }

  return (
    <div className="stadium-visual-container">
      <div className="stadium-map">
        
        {/* Left Stand (C) */}
        <StandSectorGrid standName="C" totalSeats={getStandData('C').total_seats} prefix="C" rows={5} cols={2} />

        <div className="stadium-center-column">
          {/* Top Stand (A) and VIP - Same Row */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
            <StandSectorGrid standName="A" totalSeats={getStandData('A').total_seats} prefix="A" rows={3} cols={6} />
            
            <div className="stand-sector-wrapper stand-vip">
              <div className="stand-sector-title" style={{ color: '#818cf8' }}>VIP AREA</div>
              <div className="sector-cell" style={{ background: 'rgba(79, 70, 229, 0.2)', border: '1px solid #4f46e5' }}>
                <span className="sector-id" style={{ color: '#fff' }}>VIP</span>
                <span className="sector-seats" style={{ color: '#fff' }}>{getStandData('VIP').total_seats} Seats</span>
              </div>
            </div>
          </div>

          {/* The Pitch */}
          <div className="football-pitch" style={{ margin: '20px 0' }}>
            <div className="pitch-outline">
              <div className="center-circle"></div>
              <div className="penalty-area left"></div>
              <div className="penalty-area right"></div>
            </div>
          </div>

          {/* Bottom Stand (B) */}
          <StandSectorGrid standName="B" totalSeats={getStandData('B').total_seats} prefix="B" rows={3} cols={6} />
        </div>

        {/* Right Stand (D) */}
        <div className="stadium-side-column">
          <StandSectorGrid standName="D" totalSeats={getStandData('D').total_seats} prefix="D" rows={5} cols={2} />
        </div>

      </div>
    </div>
  )
}

export default function StandConfigPage() {
  const { matchId } = useParams()
  const [totalCapacity, setTotalCapacity] = useState('500')
  const [vipCapacity, setVipCapacity] = useState('100')
  const [prices, setPrices] = useState({ VIP: '500000', A: '200000', B: '200000', C: '100000', D: '100000' })
  const [serverPreview, setServerPreview] = useState([])

  const localPreview = useMemo(
    () => (totalCapacity ? generateStandsPreview(Number(totalCapacity), Number(vipCapacity)) : []),
    [totalCapacity, vipCapacity],
  )

  const payload = useMemo(
    () => ({
      totalCapacity: Number(totalCapacity),
      vipCapacity: Number(vipCapacity),
      prices: {
        VIP: Number(prices.VIP || 0),
        A: Number(prices.A || 0),
        B: Number(prices.B || 0),
        C: Number(prices.C || 0),
        D: Number(prices.D || 0),
      },
    }),
    [prices, totalCapacity, vipCapacity],
  )

  const previewOnServer = async () => {
    try {
      const response = await matchService.previewStands(payload)
      setServerPreview(response.data?.data || [])
      toast.success('API Preview generated.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Preview failed.')
    }
  }

  const saveConfig = async () => {
    try {
      await matchService.configureStands(matchId, payload)
      toast.success('Configuration saved and seats generated!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Save failed.')
    }
  }

  return (
    <section className="container manager-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <Link to="/manager" className="back-link">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <h1 className="dashboard-title">Stadium Configuration</h1>
          <p className="dashboard-subtitle">Define seat capacity, VIP zones, and dynamic pricing</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="mc-btn mc-btn-ghost" onClick={previewOnServer}>
            <Eye size={18} style={{ marginRight: '8px' }} />
            API Preview
          </button>
          <button className="mc-btn mc-btn-primary" onClick={saveConfig}>
            <Save size={18} style={{ marginRight: '8px' }} />
            Save Configuration
          </button>
        </div>
      </div>

      {/* TẦNG 1: Visual Stadium Map */}
      <div className="dashboard-section-head">
        <h2 className="dashboard-section-title">Visual Seating Plan</h2>
      </div>
      <StadiumMap stands={localPreview} />

      {/* TẦNG 2: Configuration Form */}
      <div className="config-layout">
        <div className="config-form-section">
          <h3 className="config-sub-title">Capacity Settings</h3>
          <div className="mc-details-grid">
            <div className="mc-input-group">
              <label>TOTAL STADIUM CAPACITY</label>
              <input 
                type="number" 
                className="mc-nice-input" 
                value={totalCapacity} 
                onChange={(e) => setTotalCapacity(e.target.value)} 
              />
            </div>
            <div className="mc-input-group">
              <label>VIP SEATS COUNT</label>
              <input 
                type="number" 
                className="mc-nice-input" 
                style={{ borderColor: '#4f46e5', borderWidth: '2px' }}
                value={vipCapacity} 
                onChange={(e) => setVipCapacity(e.target.value)} 
              />
            </div>
          </div>

          <h3 className="config-sub-title" style={{ marginTop: '30px' }}>Pricing Strategy (VND)</h3>
          <div className="pricing-grid">
            {STAND_NAMES.map((name) => (
              <div key={name} className="mc-input-group">
                <label className={name === 'VIP' ? 'vip-label' : ''}>{name === 'VIP' ? '💎 VIP PRICE' : `STAND ${name} PRICE`}</label>
                <input
                  type="number"
                  className={`mc-nice-input ${name === 'VIP' ? 'vip-input' : ''}`}
                  placeholder="0"
                  value={prices[name]}
                  onChange={(e) => setPrices((p) => ({ ...p, [name]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="config-summary-section">
          <div className="config-summary-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <ShieldCheck size={24} color="#4f46e5" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Configuration Summary</h3>
            </div>
            <div className="summary-list">
              {localPreview.map(stand => (
                <div key={stand.name} className="summary-item">
                  <span className="summary-label">Stand {stand.name}</span>
                  <div className="summary-values">
                    <span className="summary-seats">{stand.total_seats} seats</span>
                    <span className="summary-grid">{stand.rows}x{stand.seats_per_row} grid</span>
                  </div>
                </div>
              ))}
              <div className="summary-divider"></div>
              <div className="summary-item total">
                <span className="summary-label">Final Capacity</span>
                <span className="summary-seats">{localPreview.reduce((acc, s) => acc + s.total_seats, 0)} Seats</span>
              </div>
            </div>
            <p className="summary-note">
              * The total seats might vary slightly from the capacity due to grid rounding.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
