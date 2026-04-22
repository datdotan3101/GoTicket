import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save, Eye, Layout, ShieldCheck } from 'lucide-react'
import { STAND_NAMES } from '../../constants/standRatios'
import { matchService } from '../../services/matchService'
import { generateStandsPreview } from '../../utils/standGenerator'

const StadiumMap = ({ stands }) => {
  const getStandData = (name) => stands.find(s => s.name === name) || { total_seats: 0 }

  return (
    <div className="stadium-visual-container">
      <div className="stadium-map">
        {/* Khán đài A (Left) */}
        <div className="stand-block stand-a">
          <span className="stand-name">STAND A</span>
          <span className="stand-seats">{getStandData('A').total_seats} Seats</span>
        </div>

        {/* Center area with Pitch and VIP */}
        <div className="stadium-center-column">
          {/* Khán đài VIP (Top Center) */}
          <div className="stand-block stand-vip">
            <span className="stand-name">VIP AREA</span>
            <span className="stand-seats">{getStandData('VIP').total_seats} Seats</span>
          </div>

          {/* The Pitch */}
          <div className="football-pitch">
            <div className="pitch-outline">
              <div className="center-circle"></div>
              <div className="penalty-area left"></div>
              <div className="penalty-area right"></div>
            </div>
          </div>

          {/* Khán đài B (Bottom Center) */}
          <div className="stand-block stand-b">
            <span className="stand-name">STAND B</span>
            <span className="stand-seats">{getStandData('B').total_seats} Seats</span>
          </div>
        </div>

        {/* Khán đài C & D (Corners or Sides - mapping to user request) */}
        {/* We'll put C on the Right and D can be a corner or split */}
        <div className="stadium-side-column">
           <div className="stand-block stand-c">
            <span className="stand-name">STAND C</span>
            <span className="stand-seats">{getStandData('C').total_seats} Seats</span>
          </div>
          <div className="stand-block stand-d">
            <span className="stand-name">STAND D</span>
            <span className="stand-seats">{getStandData('D').total_seats} Seats</span>
          </div>
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
