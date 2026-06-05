/* eslint-disable no-unused-vars */
import { useEffect, useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { matchService } from '../../services/matchService'
import { stadiumService } from '../../services/stadiumService'
import { leagueService } from '../../services/leagueService'
import { clubService } from '../../services/clubService'
import { uploadService } from '../../services/uploadService'
import { unwrapData } from '../../utils/apiData'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { format } from 'date-fns'
import { validateForm } from '../../utils/validator'
import { redistributeStadiumSeats } from '../../utils/seatDistribution'
import Select from 'react-select'
import { Info, Image as ImageIcon, UploadCloud, Rocket, ArrowRight, CheckCircle } from 'lucide-react'

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

const STAND_RATIOS = { A: 0.3, B: 0.3, C: 0.2, D: 0.2 }

export default function MatchCreatePage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    leagueId: '',
    homeTeam: '',
    awayTeam: '',
    matchDate: '',
    ticketSaleOpenAt: '',
    stadiumId: '',
    description: '',
  })

  const [totalCapacity, setTotalCapacity] = useState('10000')
  
  const [columnConfigs, setColumnConfigs] = useState(
    STADIUM_COLUMNS.reduce((acc, col) => {
      acc[col.id] = { price: '', activeTiers: [...col.tiers] }
      return acc
    }, {})
  )

  const [stadiums, setStadiums] = useState([])
  const [leagues, setLeagues] = useState([])
  const [clubs, setClubs] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewBannerUrl, setPreviewBannerUrl] = useState(null)
  const [selectedBannerFile, setSelectedBannerFile] = useState(null)
  const [showConfirmPopup, setShowConfirmPopup] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    if (form.stadiumId && stadiums.length > 0) {
      const selected = stadiums.find(s => String(s.id) === String(form.stadiumId))
      if (selected && selected.capacity) {
        setTotalCapacity(selected.capacity.toString())
      } else {
        setTotalCapacity('0')
      }
    } else {
      setTotalCapacity('0')
    }
  }, [form.stadiumId, stadiums])


  const clubOptions = useMemo(() => {
    return clubs
      .filter(c => form.leagueId ? String(c.league_id) === String(form.leagueId) : false)
      .map(c => ({ value: c.name, label: c.name }))
  }, [clubs, form.leagueId])

  useEffect(() => {
    const load = async () => {
      try {
        const [stadiumsRes, leaguesRes, clubsRes] = await Promise.all([
          stadiumService.getAll(),
          leagueService.getAll(),
          clubService.getAll({ limit: 200 })
        ])
        setStadiums(unwrapData(stadiumsRes) || [])
        const leaguePayload = unwrapData(leaguesRes)
        setLeagues(leaguePayload?.data || leaguePayload || [])
        const clubPayload = unwrapData(clubsRes)
        setClubs(clubPayload?.data || clubPayload || [])
      } catch {
        setStadiums([])
        setLeagues([])
        setClubs([])
      }
    }
    load()
  }, [])

  // Convert to blockConfigs format for backend based on ratio and level
  const blockConfigs = useMemo(() => {
    const configs = {}
    const total = Number(totalCapacity) || 0
    const activeBlocks = [];
    STADIUM_COLUMNS.forEach(col => {
      col.tiers.forEach(tier => {
        if (columnConfigs[col.id].activeTiers.includes(tier)) {
          activeBlocks.push({ colId: col.id, stand: col.stand, tier, blockId: `${col.id}-${tier}` });
        }
      })
    });

    try {
      const standTotals = {
        A: Math.floor(total * STAND_RATIOS.A),
        B: Math.floor(total * STAND_RATIOS.B),
        C: Math.floor(total * STAND_RATIOS.C),
        D: Math.floor(total * STAND_RATIOS.D)
      }
      const seatDistribution = redistributeStadiumSeats(total, activeBlocks, standTotals);
      
      activeBlocks.forEach(block => {
        configs[block.blockId] = {
          price: Number(columnConfigs[block.colId].price) || 0,
          capacity: seatDistribution[block.blockId] || 0,
          active: true
        }
      });
    } catch (e) {
      // If error (e.g. no blocks enabled), capacities will be 0 via the inactive blocks logic below
    }

    // Fill inactive blocks with 0
    STADIUM_COLUMNS.forEach(col => {
      col.tiers.forEach(tier => {
        const blockId = `${col.id}-${tier}`
        if (!configs[blockId]) {
          configs[blockId] = {
            price: Number(columnConfigs[col.id].price) || 0,
            capacity: 0,
            active: false
          }
        }
      })
    })

    return configs
  }, [columnConfigs, totalCapacity])

  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      const dataToValidate = {
        ...form,
        banner: selectedBannerFile ? 'yes' : ''
      }
      const schema = {
        leagueId: { required: 'League' },
        stadiumId: { required: 'Stadium' },
        homeTeam: { required: 'Home Team' },
        awayTeam: { 
          required: 'Away Team',
          custom: (val) => val === form.homeTeam ? 'Home and Away teams must be different' : null
        },
        matchDate: { 
          required: 'Date & Time',
          custom: (val) => new Date(val) < new Date() ? 'Match date cannot be in the past' : null
        },
        ticketSaleOpenAt: {
          required: 'Ticket sale opening date',
          custom: (val) => {
            if (new Date(val) < new Date()) return 'Ticket sale opening date cannot be in the past'
            if (form.matchDate && new Date(val) >= new Date(form.matchDate)) return 'Ticket sale date must be before the match date'
            return null
          }
        },
        description: { required: 'Description' },
        banner: { required: 'Banner Image' }
      }
      return validateForm(dataToValidate, schema)
    }
    if (currentStep === 2) {
      if (!totalCapacity || Number(totalCapacity) <= 0) {
        toast.error('Invalid capacity')
        return false
      }
      for (const col of STADIUM_COLUMNS) {
        if (!columnConfigs[col.id].price || Number(columnConfigs[col.id].price) < 0) {
          toast.error('Invalid price for Block ' + col.id)
          return false
        }
      }
      const activeAny = Object.keys(blockConfigs).some(k => blockConfigs[k].active)
      if (!activeAny) {
        toast.error('Please enable at least one stand')
        return false
      }
      return true
    }
    return true
  }

  const toggleTier = (colId, tier) => {
    setColumnConfigs(prev => {
      const activeTiers = prev[colId].activeTiers.includes(tier)
        ? prev[colId].activeTiers.filter(t => t !== tier)
        : [...prev[colId].activeTiers, tier]
      return { ...prev, [colId]: { ...prev[colId], activeTiers } }
    })
  }

  const handleCreate = async () => {
    setIsSubmitting(true)
    try {
      let uploadedBannerUrl = null;
      if (selectedBannerFile) {
        try {
          const uploadRes = await uploadService.uploadFile(selectedBannerFile);
          uploadedBannerUrl = uploadRes.data?.url || uploadRes.url || null;
        } catch (e) {
          toast.error("Banner upload failed, proceeding without image.");
        }
      }

      const basicPayload = {
        homeTeam: form.homeTeam,
        awayTeam: form.awayTeam,
        matchDate: form.matchDate,
        stadiumId: Number(form.stadiumId),
        leagueId: Number(form.leagueId),
        description: form.description,
        thumbnailUrl: uploadedBannerUrl,
        ticketSaleOpenAt: form.ticketSaleOpenAt,
      }

      const matchRes = await matchService.create(basicPayload)
      const createdMatch = unwrapData(matchRes)
      const matchId = createdMatch.id

      try {
        const standsPayload = { 
          totalCapacity: Number(totalCapacity),
          blockConfigs 
        }
        await matchService.configureStands(matchId, standsPayload)
        await matchService.submit(matchId)
      } catch (stepError) {
        try { await matchService.delete(matchId) } catch { /* ignore */ }
        throw stepError
      }

      toast.success('Match created and sent for approval!')
      navigate('/manager')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Creation workflow failed.')
    } finally {
      setIsSubmitting(false)
      setShowConfirmPopup(false)
    }
  }

  const selectedStadium = stadiums.find(s => String(s.id) === String(form.stadiumId))

  return (
    <section className="manager-create-page" style={{ padding: '60px 20px' }}>
      <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto 40px auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e1b4b', marginBottom: '12px', letterSpacing: '-0.02em' }}>Create New Match</h1>
        <p style={{ fontSize: '1.1rem', color: '#64748b', maxWidth: '600px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>
          Configure your tournament event details, stadium seating, and dynamic pricing in two simple steps.
        </p>

        <div className="mc-stepper" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className={`mc-step ${step >= 1 ? 'active' : ''}`}>
            <div className="mc-step-meta">
              <span className="mc-step-label">STEP 01</span>
              <div className="mc-step-bar"></div>
            </div>
            <div className="mc-step-title">Basic Information</div>
          </div>
          <div className={`mc-step ${step >= 2 ? 'active' : ''}`}>
            <div className="mc-step-meta">
              <span className="mc-step-label">STEP 02</span>
              <div className="mc-step-bar"></div>
            </div>
            <div className="mc-step-title">Configuration</div>
          </div>
        </div>
      </div>

      <div className="mc-step-content" style={{ padding: '40px 0' }}>
        {step === 1 && (
          <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}>
            <div className="mc-form-step" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '40px', alignItems: 'start' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ marginBottom: '32px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e1b4b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    Match Information
                  </h3>
                  <p style={{ margin: '4px 0 0 28px', fontSize: '0.85rem', color: '#64748b' }}>Enter the basic tournament and matchup details.</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px', marginBottom: '24px' }}>
                  <div className="mc-input-group">
                    <label>LEAGUE NAME</label>
                    <select className="mc-nice-input" value={form.leagueId} onChange={e => {setForm(p => ({...p, leagueId: e.target.value}))}}>
                      <option value="" disabled>Select league</option>
                      {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                  <div className="mc-input-group">
                    <label>STADIUM</label>
                    <select className="mc-nice-input" value={form.stadiumId} onChange={e => {setForm(p => ({...p, stadiumId: e.target.value}))}}>
                      <option value="" disabled>Select stadium</option>
                      {stadiums.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px', marginBottom: '24px' }}>
                  <div className="mc-input-group">
                    <label>MATCH DATE & TIME</label>
                    <div style={{ borderRadius: "8px" }}>
                      <DatePicker
                        selected={form.matchDate ? new Date(form.matchDate) : null}
                        onChange={(date) => {setForm(p => ({...p, matchDate: date ? date.toISOString() : ''}))}}
                        showTimeSelect
                        timeFormat="HH:mm"
                        timeIntervals={15}
                        dateFormat="MM/dd/yyyy HH:mm"
                        className="mc-nice-input w-full"
                        wrapperClassName="w-full !block"
                        placeholderText="mm/dd/yyyy --:--"
                      />
                    </div>
                  </div>
                  <div className="mc-input-group">
                    <label>TICKET SALE OPEN AT</label>
                    <div style={{ borderRadius: "8px" }}>
                      <DatePicker
                        selected={form.ticketSaleOpenAt ? new Date(form.ticketSaleOpenAt) : null}
                        onChange={(date) => {setForm(p => ({...p, ticketSaleOpenAt: date ? date.toISOString() : ''}))}}
                        showTimeSelect
                        timeFormat="HH:mm"
                        timeIntervals={15}
                        dateFormat="MM/dd/yyyy HH:mm"
                        className="mc-nice-input w-full"
                        wrapperClassName="w-full !block"
                        placeholderText="mm/dd/yyyy --:--"
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px' }}>
                  <div className="mc-input-group" style={{ minWidth: 0 }}>
                    <label>HOME TEAM</label>
                    <Select
                      options={clubOptions}
                      value={clubOptions.find(o => o.value === form.homeTeam) || null}
                      onChange={(selected) => {
                        setForm(p => ({...p, homeTeam: selected ? selected.value : ''}))
                      }}
                      placeholder="Select home team"
                      isClearable
                      isSearchable
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      noOptionsMessage={() => form.leagueId ? 'No teams found' : 'Please select a league first'}
                      styles={{
                        container: (base) => ({ ...base, width: '100%' }),
                        control: (base) => ({
                          ...base,
                          borderColor: '#e2e8f0',
                          borderRadius: '8px',
                          minHeight: '44px',
                          boxShadow: 'none',
                          '&:hover': { borderColor: '#cbd5e1' }
                        }),
                        valueContainer: (base) => ({ ...base, overflow: 'hidden', flexWrap: 'nowrap' }),
                        singleValue: (base) => ({ ...base, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }),
                        menuPortal: (base) => ({ ...base, zIndex: 9999 })
                      }}
                    />
                  </div>
                  <div className="mc-input-group" style={{ minWidth: 0 }}>
                    <label>AWAY TEAM</label>
                    <Select
                      options={clubOptions}
                      value={clubOptions.find(o => o.value === form.awayTeam) || null}
                      onChange={(selected) => {
                        setForm(p => ({...p, awayTeam: selected ? selected.value : ''}))
                      }}
                      placeholder="Select away team"
                      isClearable
                      isSearchable
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      noOptionsMessage={() => form.leagueId ? 'No teams found' : 'Please select a league first'}
                      styles={{
                        container: (base) => ({ ...base, width: '100%' }),
                        control: (base) => ({
                          ...base,
                          borderColor: '#e2e8f0',
                          borderRadius: '8px',
                          minHeight: '44px',
                          boxShadow: 'none',
                          '&:hover': { borderColor: '#cbd5e1' }
                        }),
                        valueContainer: (base) => ({ ...base, overflow: 'hidden', flexWrap: 'nowrap' }),
                        singleValue: (base) => ({ ...base, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }),
                        menuPortal: (base) => ({ ...base, zIndex: 9999 })
                      }}
                    />
                  </div>
                </div>

                <div className="mc-input-group" style={{ marginTop: '24px' }}>
                  <label>DESCRIPTION</label>
                  <textarea className="mc-nice-input" rows={3} placeholder="Enter match description" value={form.description} onChange={e => {setForm(p => ({...p, description: e.target.value}))}} />
                </div>
              </div>

              <div>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#1e1b4b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    Featured Banner
                  </h3>
                </div>
                
                <div style={{ border: `2px dashed #cbd5e1`, borderRadius: '16px', padding: '8px', textAlign: 'center', background: '#f8fafc', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '220px' }}>
                  {previewBannerUrl ? (
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                      <img src={previewBannerUrl} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          setPreviewBannerUrl(null);
                          setSelectedBannerFile(null);
                        }}
                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '18px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div style={{ cursor: 'pointer', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={() => document.getElementById('banner-upload').click()}>
                      <UploadCloud size={48} color="#cbd5e1" style={{ marginBottom: '12px' }} />
                      <div style={{ fontWeight: 800, color: '#475569', fontSize: '1rem' }}>Upload Banner</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>Recommended: 1280x720 (16:9)</div>
                    </div>
                  )}
                  <input id="banner-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                    const file = e.target.files[0];
                    if(file){
                      setPreviewBannerUrl(URL.createObjectURL(file));
                      setSelectedBannerFile(file);
                    }
                  }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                </div>
                <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  This image will be displayed on the match list and ticket.
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mc-form-step">
            <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '40px', marginBottom: '30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ marginBottom: '32px', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                  <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#1e1b4b' }}>Stadium Configuration</h2>
                  <p style={{ margin: '8px 0 0 0', color: '#64748b' }}>Define total capacity and stand-specific pricing. Capacity is split 30/30/20/20 by ratio.</p>
                </div>

                <div className="mc-input-group" style={{ maxWidth: '400px', marginBottom: '40px' }}>
                  <label style={{ fontSize: '0.9rem', color: '#1e1b4b', fontWeight: 800 }}>TOTAL STADIUM CAPACITY</label>
                  <input 
                    type="number" 
                    className="mc-nice-input" 
                    style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f97316', background: '#f1f5f9', cursor: 'not-allowed' }}
                    value={totalCapacity} 
                    readOnly
                  />
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px' }}>This total will be divided into Stands A, B, C, D automatically.</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  {['A', 'B', 'C', 'D'].map(standName => {
                    const columns = STADIUM_COLUMNS.filter(c => c.stand === standName)
                    if (columns.length === 0) return null
                    return (
                      <div key={standName} style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', gridColumn: '1 / -1' }}>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>Stand {standName}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                          {columns.map(col => {
                            const isActive = col.tiers.some(t => columnConfigs[col.id]?.activeTiers.includes(t))
                            return (
                              <div key={col.id} style={{ 
                                background: '#fff', padding: '16px', borderRadius: '8px', 
                                border: `1px solid ${isActive ? '#cbd5e1' : '#e2e8f0'}`,
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>Block {col.id}</span>
                                </div>
                                <div style={{ position: 'relative', marginBottom: '16px' }}>
                                  <input 
                                    type="number" className="mc-nice-input" placeholder="Ticket Price" 
                                    style={{ width: '100%', paddingLeft: '45px' }} 
                                    value={columnConfigs[col.id]?.price} 
                                    min="0"
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setColumnConfigs(p => ({ ...p, [col.id]: { ...p[col.id], price: val } }));
                                      if (Number(val) < 0) {
                                        toast.error('Ticket price cannot be negative');
                                      }
                                    }} 
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
                                      Enable Floor {tier.replace('T', '')}
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
            </div>
          </div>
        )}
      </div>

      <div className="mc-form-footer">
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <button className="mc-btn mc-btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
          <div className="mc-footer-right">
            {step > 1 && <button className="mc-btn mc-btn-secondary" onClick={() => setStep(step - 1)}>Back</button>}
            {step === 1 && <button className="mc-btn mc-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => {
              if(validateStep(1)) {
                setStep(2)
              }
            }}>Configure Stadium <ArrowRight size={18} /></button>}
            {step === 2 && <button className="mc-btn mc-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => {
              if(validateStep(2)) setShowConfirmPopup(true)
            }}>Review & Publish <CheckCircle size={18} /></button>}
          </div>
        </div>
      </div>

      {showConfirmPopup && (
        <div className="modal-overlay" onClick={() => setShowConfirmPopup(false)}>
          <div className="modal-content" style={{ maxWidth: '700px', padding: '40px' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ width: '80px', height: '80px', background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}>
                <Rocket size={40} color="#10b981" />
              </div>
              <h2 className="modal-title" style={{ fontSize: '1.75rem' }}>Final Confirmation</h2>
              <p style={{ color: '#64748b', marginTop: '8px' }}>Please review the seating ratio and pricing before submission.</p>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>MATCHUP</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e1b4b' }}>{form.homeTeam} vs {form.awayTeam}</div>
                  <div style={{ fontSize: '0.85rem', color: '#f97316', fontWeight: 700 }}>{leagues.find(l => l.id === Number(form.leagueId))?.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>TOTAL CAPACITY</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f97316' }}>{Number(totalCapacity).toLocaleString()}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>STAND PRICING & RATIOS</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {['A', 'B', 'C', 'D'].map(standName => {
                    const columns = STADIUM_COLUMNS.filter(c => c.stand === standName)
                    const activeBlocks = columns.reduce((acc, col) => acc + columnConfigs[col.id].activeTiers.length, 0)
                    const standPrices = columns.map(c => Number(columnConfigs[c.id].price)).filter(p => p > 0)
                    const standPriceMin = standPrices.length ? Math.min(...standPrices) : 0
                    const standPriceMax = standPrices.length ? Math.max(...standPrices) : 0
                    
                    return (
                    <div key={standName} style={{ background: '#fff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 800, color: '#1e293b' }}>Stand {standName}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{Math.floor(Number(totalCapacity) * STAND_RATIOS[standName]).toLocaleString()} seats</span>
                        <span style={{ fontWeight: 900, color: '#f97316' }}>{standPriceMin === standPriceMax ? standPriceMin.toLocaleString() : `${standPriceMin.toLocaleString()} - ${standPriceMax.toLocaleString()}`} VND</span>
                      </div>
                      <div style={{ marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '6px', fontSize: '0.65rem', color: '#94a3b8' }}>
                        Active Blocks: {activeBlocks}
                      </div>
                    </div>
                  )})}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="mc-btn mc-btn-secondary" style={{ flex: 1, padding: '16px' }} onClick={() => setShowConfirmPopup(false)}>Go Back</button>
              <button className="mc-btn mc-btn-primary" style={{ flex: 2, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : <>Confirm & Publish <CheckCircle size={18} /></>}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
