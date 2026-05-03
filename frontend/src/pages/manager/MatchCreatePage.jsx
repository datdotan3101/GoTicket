import { useEffect, useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { matchService } from '../../services/matchService'
import { stadiumService } from '../../services/stadiumService'
import { leagueService } from '../../services/leagueService'
import { uploadService } from '../../services/uploadService'
import { unwrapData } from '../../utils/apiData'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { format } from 'date-fns'

const INITIAL_STANDS = {
  A: { price: '', tiers: [{ id: 'T1', active: true }, { id: 'T2', active: true }] },
  B: { price: '', tiers: [{ id: 'T1', active: true }, { id: 'T2', active: true }] },
  C: { price: '', tiers: [{ id: 'T1', active: true }] },
  D: { price: '', tiers: [{ id: 'T1', active: true }] },
}

const STAND_RATIOS = { A: 0.3, B: 0.3, C: 0.2, D: 0.2 }

export default function MatchCreatePage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    leagueId: '',
    homeTeam: '',
    awayTeam: '',
    matchDate: '',
    stadiumId: '',
    description: '',
  })

  const [totalCapacity, setTotalCapacity] = useState('10000')
  const [stands, setStands] = useState(INITIAL_STANDS)

  const [stadiums, setStadiums] = useState([])
  const [leagues, setLeagues] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewBannerUrl, setPreviewBannerUrl] = useState(null)
  const [selectedBannerFile, setSelectedBannerFile] = useState(null)
  const [showConfirmPopup, setShowConfirmPopup] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const [stadiumsRes, leaguesRes] = await Promise.all([
          stadiumService.getAll(),
          leagueService.getAll()
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

  // Chuyển đổi sang định dạng blockConfigs cho backend dựa trên tỷ lệ và tầng
  const blockConfigs = useMemo(() => {
    const configs = {}
    const total = Number(totalCapacity) || 0
    
    Object.keys(stands).forEach(standKey => {
      const standData = stands[standKey]
      const standCapacityTotal = Math.floor(total * STAND_RATIOS[standKey])
      const tierCount = standData.tiers.length
      const tierCapacity = tierCount > 0 ? Math.floor(standCapacityTotal / tierCount) : 0
      
      standData.tiers.forEach(tier => {
        const blockId = `${standKey}-${tier.id}`
        configs[blockId] = {
          price: Number(standData.price) || 0,
          capacity: tierCapacity,
          active: tier.active
        }
      })
    })
    return configs
  }, [stands, totalCapacity])

  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      if (!form.leagueId) return 'League selection is required.'
      if (!form.homeTeam) return 'Home team is required.'
      if (!form.awayTeam) return 'Away team is required.'
      if (!form.matchDate) return 'Match date and time is required.'
      if (!form.stadiumId) return 'Please select a stadium.'
    }
    if (currentStep === 2) {
      if (!totalCapacity || Number(totalCapacity) <= 0) return 'Please enter a valid total stadium capacity.'
      
      let error = null
      Object.keys(stands).forEach(sk => {
        if (!stands[sk].price || Number(stands[sk].price) < 0) {
          error = `Stand ${sk} must have a valid price.`
        }
        if (stands[sk].tiers.length === 0) {
          error = `Stand ${sk} must have at least one tier.`
        }
      })
      if (error) return error

      const activeAny = Object.keys(blockConfigs).some(k => blockConfigs[k].active)
      if (!activeAny) return 'Please enable at least one tier for sale.'
    }
    return null
  }

  const handleAddTier = (standKey) => {
    setStands(prev => {
      const nextId = `T${prev[standKey].tiers.length + 1}`
      return {
        ...prev,
        [standKey]: {
          ...prev[standKey],
          tiers: [...prev[standKey].tiers, { id: nextId, active: true }]
        }
      }
    })
  }

  const handleRemoveTier = (standKey, tierId) => {
    setStands(prev => ({
      ...prev,
      [standKey]: {
        ...prev[standKey],
        tiers: prev[standKey].tiers.filter(t => t.id !== tierId)
      }
    }))
  }

  const updateStandPrice = (standKey, price) => {
    setStands(prev => ({
      ...prev,
      [standKey]: { ...prev[standKey], price }
    }))
  }

  const toggleTierActive = (standKey, tierId) => {
    setStands(prev => ({
      ...prev,
      [standKey]: {
        ...prev[standKey],
        tiers: prev[standKey].tiers.map(t => t.id === tierId ? { ...t, active: !t.active } : t)
      }
    }))
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
        try { await matchService.delete(matchId) } catch (_) {}
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

  const selectedStadium = stadiums.find(s => s.id === Number(form.stadiumId))

  return (
    <section className="manager-create-page" style={{ padding: '60px 20px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto 40px auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', background: '#fef2f2', color: '#ef4444', padding: '6px 16px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, marginBottom: '20px', border: '1px solid #fee2e2' }}>
          <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', marginRight: '8px', display: 'inline-block' }}></span>
          SYSTEM OPERATIONAL
        </div>
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
          <div style={{ maxWidth: '1100px', margin: '0 auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}>
            <div className="mc-form-step" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '40px', alignItems: 'start' }}>
              <div>
                <div style={{ marginBottom: '32px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e1b4b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#f97316' }}>ⓘ</span> Match Information
                  </h3>
                  <p style={{ margin: '4px 0 0 28px', fontSize: '0.85rem', color: '#64748b' }}>Enter the basic tournament and matchup details.</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                  <div className="mc-input-group">
                    <label>LEAGUE NAME</label>
                    <select className="mc-nice-input" value={form.leagueId} onChange={e => setForm(p => ({...p, leagueId: e.target.value}))}>
                      <option value="" disabled>Select league</option>
                      {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                  <div className="mc-input-group">
                    <label>STADIUM</label>
                    <select className="mc-nice-input" value={form.stadiumId} onChange={e => setForm(p => ({...p, stadiumId: e.target.value}))}>
                      <option value="" disabled>Select stadium</option>
                      {stadiums.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                  <div className="mc-input-group">
                    <label>MATCH DATE & TIME</label>
                    <DatePicker
                      selected={form.matchDate ? new Date(form.matchDate) : null}
                      onChange={(date) => setForm(p => ({...p, matchDate: date ? date.toISOString() : ''}))}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div className="mc-input-group">
                    <label>HOME TEAM</label>
                    <input className="mc-nice-input" placeholder="Select home team" value={form.homeTeam} onChange={e => setForm(p => ({...p, homeTeam: e.target.value}))} />
                  </div>
                  <div className="mc-input-group">
                    <label>AWAY TEAM</label>
                    <input className="mc-nice-input" placeholder="Select away team" value={form.awayTeam} onChange={e => setForm(p => ({...p, awayTeam: e.target.value}))} />
                  </div>
                </div>
              </div>

              <div>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#1e1b4b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#f97316' }}>🖼️</span> Featured Banner
                  </h3>
                </div>
                
                <div style={{ border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '8px', textAlign: 'center', background: '#f8fafc', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '220px' }}>
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
                    <div style={{ cursor: 'pointer', padding: '40px' }} onClick={() => document.getElementById('banner-upload').click()}>
                      <div style={{ color: '#f97316', fontSize: '3rem', marginBottom: '12px' }}>📄</div>
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
                <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  This image will be displayed on the match list and ticket.
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mc-form-step">
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
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
                    style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f97316' }}
                    value={totalCapacity} 
                    onChange={e => setTotalCapacity(e.target.value)} 
                  />
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px' }}>This total will be divided into Stands A, B, C, D automatically.</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: '30px' }}>
                  {Object.keys(stands).map(sk => {
                    const standCapacityTotal = Math.floor(Number(totalCapacity) * STAND_RATIOS[sk])
                    return (
                      <div key={sk} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', background: '#fcfdfe' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e1b4b' }}>Stand {sk}</h3>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f97316' }}>{STAND_RATIOS[sk] * 100}% Ratio • {standCapacityTotal.toLocaleString()} seats</div>
                          </div>
                          <div className="mc-input-group" style={{ width: '180px', marginBottom: 0 }}>
                            <label style={{ fontSize: '0.7rem' }}>PRICE (VND)</label>
                            <input 
                              type="number" 
                              className="mc-nice-input" 
                              placeholder="Price" 
                              value={stands[sk].price} 
                              onChange={e => updateStandPrice(sk, e.target.value)} 
                            />
                          </div>
                        </div>

                        <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}>TIER MANAGEMENT</span>
                            <button className="mc-btn mc-btn-secondary" style={{ padding: '4px 12px', fontSize: '0.7rem' }} onClick={() => handleAddTier(sk)}>+ Add Tier</button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {stands[sk].tiers.map(t => (
                              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: t.active ? '#f8fafc' : '#f1f5f9', borderRadius: '8px', border: t.active ? '1px solid #e2e8f0' : '1px solid transparent' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={t.active} 
                                    onChange={() => toggleTierActive(sk, t.id)}
                                    style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
                                  />
                                  <span style={{ fontWeight: 800, color: t.active ? '#1e293b' : '#94a3b8' }}>{sk} - {t.id}</span>
                                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>~{Math.floor(standCapacityTotal / stands[sk].tiers.length)} seats</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: t.active ? '#10b981' : '#94a3b8' }}>
                                    {t.active ? 'FOR SALE' : 'NOT FOR SALE'}
                                  </span>
                                  <button 
                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}
                                    onClick={() => handleRemoveTier(sk, t.id)}
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
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
            {step === 1 && <button className="mc-btn mc-btn-primary" onClick={() => {
              const err = validateStep(1)
              if(err) toast.error(err)
              else setStep(2)
            }}>Configure Stadium ➔</button>}
            {step === 2 && <button className="mc-btn mc-btn-primary" onClick={() => {
              const err = validateStep(2)
              if(err) toast.error(err)
              else setShowConfirmPopup(true)
            }}>Review & Publish ✨</button>}
          </div>
        </div>
      </div>

      {showConfirmPopup && (
        <div className="modal-overlay" onClick={() => setShowConfirmPopup(false)}>
          <div className="modal-content" style={{ maxWidth: '700px', padding: '40px' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ width: '80px', height: '80px', background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', fontSize: '2.5rem' }}>🚀</div>
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
                  {Object.keys(stands).map(sk => (
                    <div key={sk} style={{ background: '#fff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 800, color: '#1e293b' }}>Stand {sk}</span>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{STAND_RATIOS[sk]*100}% Ratio</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{Math.floor(Number(totalCapacity) * STAND_RATIOS[sk]).toLocaleString()} seats</span>
                        <span style={{ fontWeight: 900, color: '#f97316' }}>{Number(stands[sk].price).toLocaleString()} ₫</span>
                      </div>
                      <div style={{ marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '6px', fontSize: '0.65rem', color: '#94a3b8' }}>
                        Active Tiers: {stands[sk].tiers.filter(t => t.active).map(t => t.id).join(', ') || 'None'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="mc-btn mc-btn-secondary" style={{ flex: 1, padding: '16px' }} onClick={() => setShowConfirmPopup(false)}>Go Back</button>
              <button className="mc-btn mc-btn-primary" style={{ flex: 2, padding: '16px' }} onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Confirm & Publish ✨'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
