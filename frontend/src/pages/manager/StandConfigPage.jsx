import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save, Eye, ShieldCheck } from 'lucide-react'
import { STAND_NAMES } from '../../constants/standRatios'
import { matchService } from '../../services/matchService'
import { generateStandsPreview } from '../../utils/standGenerator'
import StadiumMap from '../../components/seat/StadiumMap'

const STADIUM_COLUMNS = [
  { id: 'A1', stand: 'A', tiers: ['T1', 'T2'] },
  { id: 'A2', stand: 'A', tiers: ['T1', 'T2'] },
  { id: 'A3', stand: 'A', tiers: ['T1', 'T2'] },
  { id: 'A4', stand: 'A', tiers: ['T1', 'T2'] },
  { id: 'A5', stand: 'A', tiers: ['T1', 'T2'] },
  { id: 'B8', stand: 'B', tiers: ['T1'] },
  { id: 'B9', stand: 'B', tiers: ['T1'] },
  { id: 'B10', stand: 'B', tiers: ['T1'] },
  { id: 'B12', stand: 'B', tiers: ['T1'] },
  { id: 'B13', stand: 'B', tiers: ['T1'] },
  { id: 'B14', stand: 'B', tiers: ['T1'] },
  { id: 'B15', stand: 'B', tiers: ['T1'] },
  { id: 'C', stand: 'C', tiers: ['T1'] },
  { id: 'D', stand: 'D', tiers: ['T1'] },
]

export default function StandConfigPage() {
  const { matchId } = useParams()
  const [serverPreview, setServerPreview] = useState([])
  
  const [columnConfigs, setColumnConfigs] = useState(
    STADIUM_COLUMNS.reduce((acc, col) => {
      acc[col.id] = { price: '200000', activeTiers: [...col.tiers] }
      return acc
    }, {})
  )

  const blockConfigs = useMemo(() => {
    const configs = {}
    STADIUM_COLUMNS.forEach(col => {
      col.tiers.forEach(tier => {
        const blockId = `${col.id}-${tier}`
        configs[blockId] = {
          price: columnConfigs[col.id].price,
          active: columnConfigs[col.id].activeTiers.includes(tier)
        }
      })
    })
    return configs
  }, [columnConfigs])

  const localPreview = useMemo(() => {
    return []
  }, [])

  const payload = useMemo(
    () => ({
      blockConfigs
    }),
    [blockConfigs],
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

  const toggleTier = (colId, tier) => {
    setColumnConfigs(prev => {
      const activeTiers = prev[colId].activeTiers.includes(tier)
        ? prev[colId].activeTiers.filter(t => t !== tier)
        : [...prev[colId].activeTiers, tier]
      return { ...prev, [colId]: { ...prev[colId], activeTiers } }
    })
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

      {/* LEVEL 1: Visual Stadium Map */}
      <div className="dashboard-section-head">
        <h2 className="dashboard-section-title">Visual Seating Plan</h2>
      </div>
      <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
        <StadiumMap stands={localPreview} blockConfigs={blockConfigs} />
      </div>

      {/* LEVEL 2: Configuration Form */}
      <div className="config-layout">
        <div className="config-form-section">
          <h3 className="config-sub-title" style={{ marginTop: '0px' }}>Block-Level Configuration</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>Set prices by column block and toggle sale status per tier.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {['A', 'B', 'C', 'D'].map(standName => {
               const columns = STADIUM_COLUMNS.filter(c => c.stand === standName)
               if (columns.length === 0) return null
               return (
                 <div key={standName} style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                   <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>Stand {standName}</h4>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                     {columns.map(col => {
                       const isActive = col.tiers.some(t => columnConfigs[col.id]?.activeTiers.includes(t))
                       return (
                         <div key={col.id} style={{ 
                           background: '#fff', 
                           padding: '16px', 
                           borderRadius: '8px', 
                           border: `1px solid ${isActive ? '#cbd5e1' : '#e2e8f0'}`,
                         }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                             <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>Block {col.id}</span>
                           </div>
                           <div style={{ position: 'relative', marginBottom: '16px' }}>
                             <input 
                               type="number" 
                               className="mc-nice-input" 
                               placeholder="Ticket Price" 
                               style={{ width: '100%', paddingLeft: '45px' }} 
                               value={columnConfigs[col.id]?.price} 
                               onChange={(e) => setColumnConfigs(p => ({ ...p, [col.id]: { ...p[col.id], price: e.target.value } }))} 
                             />
                             <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '0.75rem', fontWeight: 800 }}>VND</span>
                           </div>
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                             {col.tiers.map(tier => (
                               <label key={tier} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: '#475569', background: '#f8fafc', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                 <input 
                                   type="checkbox" 
                                   checked={columnConfigs[col.id]?.activeTiers.includes(tier)} 
                                   onChange={() => toggleTier(col.id, tier)} 
                                   style={{ width: '16px', height: '16px', accentColor: '#4f46e5' }}
                                 />
                                 Enable Level {tier.replace('T', '')}
                               </label>
                             ))}
                           </div>
                         </div>
                       )
                     })}
                   </div>
                 </div>
               )
            })}
          </div>
        </div>

        <div className="config-summary-section">
          <div className="config-summary-card" style={{ position: 'sticky', top: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <ShieldCheck size={24} color="#4f46e5" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Configuration Summary</h3>
            </div>
            <div className="summary-list">
              <div className="summary-item">
                <span className="summary-label">Active Blocks</span>
                <span className="summary-seats">{Object.values(blockConfigs).filter(b => b.active).length} Blocks</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-item total">
                <span className="summary-label">Final Capacity</span>
                <span className="summary-seats">{Object.values(blockConfigs).filter(b => b.active).length * 100} Seats</span>
              </div>
            </div>
            <p className="summary-note">
              * Each active block is configured with 100 seats by default.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
