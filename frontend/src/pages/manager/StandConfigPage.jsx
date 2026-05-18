import { useMemo, useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Eye, ShieldCheck, Loader2 } from 'lucide-react'
import { STAND_NAMES } from '../../constants/standRatios'
import { matchService } from '../../services/matchService'
import { generateStandsPreview } from '../../utils/standGenerator'
import StadiumMap from '../../components/seat/StadiumMap'
import { unwrapData } from '../../utils/apiData'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { redistributeStadiumSeats } from '../../common/seatDistribution'

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
  const navigate = useNavigate()
  const [serverPreview, setServerPreview] = useState([])
  
  const [columnConfigs, setColumnConfigs] = useState(
    STADIUM_COLUMNS.reduce((acc, col) => {
      acc[col.id] = { 
        price: '200000', 
        activeTiers: [...col.tiers],
        tierCapacities: col.tiers.reduce((tacc, t) => ({ ...tacc, [t]: 100 }), {})
      }
      return acc
    }, {})
  )
  const [fetching, setFetching] = useState(true)
  const [globalCapacity, setGlobalCapacity] = useState('10000')
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleRedistribute = () => {
    const total = Number(globalCapacity) || 0

    const activeBlocks = [];
    STADIUM_COLUMNS.forEach(col => {
      col.tiers.forEach(tier => {
        if (columnConfigs[col.id].activeTiers.includes(tier)) {
          activeBlocks.push({ colId: col.id, stand: col.stand, tier, blockId: `${col.id}-${tier}` });
        }
      })
    });

    try {
      const seatDistribution = redistributeStadiumSeats(total, activeBlocks);

      const newConfigs = { ...columnConfigs }
      // Reset all capacities first
      STADIUM_COLUMNS.forEach(col => {
        newConfigs[col.id].tierCapacities = col.tiers.reduce((acc, t) => ({ ...acc, [t]: 0 }), {})
      })

      // Apply distribution
      activeBlocks.forEach(block => {
        newConfigs[block.colId].tierCapacities[block.tier] = seatDistribution[block.blockId] || 0;
      })

      setColumnConfigs(newConfigs)
      toast.success('Seats redistributed based on total capacity')
    } catch (e) {
      toast.error(e.message || 'Failed to redistribute')
    }
  }

  useEffect(() => {
    const fetchExistingConfig = async () => {
      setFetching(true)
      try {
        const res = await matchService.getAvailability(matchId)
        const existingStands = unwrapData(res) || []
        
        if (existingStands.length > 0) {
          // Map existing stands back to columnConfigs
          const newConfigs = STADIUM_COLUMNS.reduce((acc, col) => {
            acc[col.id] = { 
              price: '200000', 
              activeTiers: [],
              tierCapacities: col.tiers.reduce((tacc, t) => ({ ...tacc, [t]: 100 }), {})
            }
            return acc
          }, {})

          existingStands.forEach(stand => {
            const [colId, tier] = stand.name.split('-')
            if (newConfigs[colId]) {
              newConfigs[colId].price = String(Math.floor(stand.price))
              newConfigs[colId].tierCapacities[tier] = stand.total_seats
              if (!newConfigs[colId].activeTiers.includes(tier)) {
                newConfigs[colId].activeTiers.push(tier)
              }
            }
          })
          setColumnConfigs(newConfigs)
        }
      } catch (error) {
        console.error('Failed to fetch existing config:', error)
      } finally {
        setFetching(false)
      }
    }
    fetchExistingConfig()
  }, [matchId])

  const blockConfigs = useMemo(() => {
    const configs = {}
    STADIUM_COLUMNS.forEach(col => {
      col.tiers.forEach(tier => {
        const blockId = `${col.id}-${tier}`
        configs[blockId] = {
          price: columnConfigs[col.id].price,
          active: columnConfigs[col.id].activeTiers.includes(tier),
          capacity: columnConfigs[col.id].tierCapacities?.[tier] || 100
        }
      })
    })
    return configs
  }, [columnConfigs])

  const localPreview = useMemo(() => {
    return []
  }, [])

  const payload = useMemo(
    () => {
      const activeBlocks = Object.values(blockConfigs).filter(b => b.active)
      const total = activeBlocks.reduce((sum, b) => sum + (Number(b.capacity) || 0), 0)
      return {
        totalCapacity: total,
        blockConfigs
      }
    },
    [blockConfigs],
  )



  const saveConfig = async () => {
    setIsSaving(true)
    try {
      await matchService.configureStands(matchId, payload)
      toast.success('Configuration saved and seats generated!')
      navigate('/manager/matches')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Save failed.')
    } finally {
      setIsSaving(false)
      setIsConfirmModalOpen(false)
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

  if (fetching) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column', gap: '16px' }}>
        <Loader2 size={40} className="animate-spin" color="#4f46e5" />
        <p style={{ color: '#64748b', fontWeight: 600 }}>Fetching stadium configuration...</p>
      </div>
    )
  }

  return (
    <section className="container manager-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <Link to="/manager/matches" className="back-link">
            <ArrowLeft size={16} />
            Back to Matches
          </Link>
          <h1 className="dashboard-title">Stadium Configuration</h1>
          <p className="dashboard-subtitle">Define seat capacity, VIP zones, and dynamic pricing</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="mc-btn mc-btn-primary" onClick={() => setIsConfirmModalOpen(true)}>
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
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                             {col.tiers.map(tier => {
                               const isActive = columnConfigs[col.id]?.activeTiers.includes(tier)
                               return (
                               <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: `1px solid ${isActive ? '#4f46e5' : '#e2e8f0'}`, flexWrap: 'wrap' }}>
                                 <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: '#475569', minWidth: '120px' }}>
                                   <input 
                                     type="checkbox" 
                                     checked={isActive} 
                                     onChange={() => toggleTier(col.id, tier)} 
                                     style={{ width: '16px', height: '16px', accentColor: '#4f46e5' }}
                                   />
                                   Level {tier.replace('T', '')}
                                 </label>
                                 {isActive && (
                                   <div style={{ position: 'relative', flex: 1, minWidth: '100px' }}>
                                     <input 
                                       type="number" 
                                       className="mc-nice-input"
                                       style={{ width: '100%', padding: '6px 8px 6px 45px', fontSize: '0.85rem' }}
                                       value={columnConfigs[col.id]?.tierCapacities?.[tier] || ''}
                                       onChange={(e) => {
                                         const val = e.target.value;
                                         setColumnConfigs(p => ({
                                           ...p,
                                           [col.id]: {
                                             ...p[col.id],
                                             tierCapacities: { ...p[col.id].tierCapacities, [tier]: val }
                                           }
                                         }))
                                       }}
                                       placeholder="Seats"
                                       title="Seat Capacity for this block"
                                     />
                                     <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '0.75rem', fontWeight: 800 }}>CAP</span>
                                   </div>
                                 )}
                               </div>
                               )
                             })}
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
              <div className="summary-item total" style={{ alignItems: 'center' }}>
                <span className="summary-label">Final Capacity</span>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="number"
                    value={globalCapacity}
                    onChange={e => {
                      setGlobalCapacity(e.target.value);
                      // Auto-apply or let them click? Better to have an Apply button nearby or just use the tool above.
                      // Let's keep it simple: this input updates globalCapacity, and we add an Apply link.
                    }}
                    style={{ 
                      width: '120px', 
                      background: 'transparent', 
                      border: 'none', 
                      borderBottom: '2px solid #4f46e5',
                      textAlign: 'right',
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: '#4f46e5',
                      padding: '0 4px',
                      outline: 'none',
                      marginRight: '8px'
                    }}
                  />
                  <span className="summary-seats" style={{ fontSize: '1.25rem' }}>Seats</span>
                </div>
              </div>
              {globalCapacity !== String(Object.values(blockConfigs).filter(b => b.active).reduce((sum, b) => sum + (Number(b.capacity) || 0), 0)) && (
                <button 
                  onClick={handleRedistribute}
                  style={{ 
                    width: '100%', 
                    marginTop: '12px', 
                    padding: '8px', 
                    background: '#4f46e5', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '8px', 
                    fontSize: '0.85rem', 
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Apply New Total
                </button>
              )}
            </div>
            <p className="summary-note">
              * Edit the total above to redistribute seats automatically.
            </p>
          </div>
        </div>
      </div>
      <ConfirmModal 
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={saveConfig}
        title="Confirm Seat Configuration"
        message="Are you sure you want to save this configuration? This will regenerate all seats and stands for this match. Existing ticket sales data might be affected if seats are removed."
        confirmLabel="Confirm Save"
        variant="primary"
        isLoading={isSaving}
      />
    </section>
  )
}
