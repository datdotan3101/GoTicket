import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Trash2, Minus, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import StadiumMap from '../../components/seat/StadiumMap'
import { matchService } from '../../services/matchService'
import { unwrapData } from '../../utils/apiData'
import { formatVND } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import CheckoutPage from './CheckoutPage'

export default function SeatSelectPage() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const [stands, setStands] = useState([])
  const [selections, setSelections] = useState([])
  const [match, setMatch] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [step, setStep] = useState(1)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const [availRes, matchRes] = await Promise.all([
          matchService.getAvailability(matchId),
          matchService.getById(matchId)
        ])
        setStands(unwrapData(availRes) ?? [])
        setMatch(unwrapData(matchRes))
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load page information')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [matchId])

  const handleSelectBlock = ({ stand, blockId, tierName }) => {
    if (!stand || stand.available_seats === 0) return

    setSelections(prev => {
      // Stand Constraint: Must be in the same stand (A, B, C, D)
      if (prev.length > 0) {
        const currentStand = prev[0].blockId.charAt(0)
        const newStand = blockId.charAt(0)
        if (currentStand !== newStand) {
          toast.error(`Khán đài không khả dụng cho lựa chọn hiện tại. Vui lòng chọn vé trong cùng một khán đài ${currentStand} hoặc xóa các lựa chọn cũ để thay đổi.`, {
            icon: '🏟️',
            duration: 4000
          })
          return prev
        }
      }

      const existing = prev.find(s => s.blockId === blockId)
      if (existing) {
        const totalQty = prev.reduce((acc, s) => acc + s.quantity, 0)
        if (totalQty >= 10) {
          toast.error('Each transaction is limited to 10 tickets total')
          return prev
        }
        return prev.map(s => s.blockId === blockId ? { ...s, quantity: Math.min(s.quantity + 1, stand.available_seats) } : s)
      } else {
        if (prev.length >= 2) {
          toast.error('You can only select up to 2 different sections within the same stand')
          return prev
        }
        const totalQty = prev.reduce((acc, s) => acc + s.quantity, 0)
        if (totalQty >= 10) {
          toast.error('Total quantity across sections cannot exceed 10')
          return prev
        }
        return [...prev, { stand, blockId, tierName, quantity: 1 }]
      }
    })
  }

  const handleListSelectStand = (stand) => {
    if (!stand || stand.available_seats === 0) return
    const blockId = stand.name
    const tierName = blockId.endsWith('T2') ? 'Floor 2' : 'Floor 1'
    handleSelectBlock({ stand, blockId, tierName })
  }

  const continueCheckout = () => {
    if (selections.length === 0) {
      toast.error('Please select at least one seating area')
      return
    }
    setStep(2)
  }

  const isNotYetOpen = match?.ticket_sale_open_at ? new Date(match.ticket_sale_open_at) > new Date() : false

  if (isLoading) return (
    <section className="container page" style={{ paddingTop: '60px' }}>
      <LoadingSpinner text="Loading stadium map..." />
    </section>
  )

  if (error) return (
    <section className="container page" style={{ paddingTop: '60px' }}>
      <ErrorState title="Data Loading Error" message={error} onRetry={() => window.location.reload()} />
    </section>
  )

  if (isNotYetOpen) return (
    <section className="container page" style={{ paddingTop: '100px', maxWidth: '800px' }}>
      <div style={{ textAlign: 'center', background: '#fff', padding: '60px', borderRadius: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <span style={{ fontSize: '32px' }}>🛒</span>
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b', marginBottom: '16px' }}>Tickets Not Yet On Sale</h1>
        <p style={{ fontSize: '1.1rem', color: '#64748b', marginBottom: '32px', lineHeight: 1.6 }}>
          We're excited for the upcoming match! However, ticket sales haven't started yet.<br/>
          Please come back when the sale officially opens.
        </p>
        
        <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '24px', display: 'inline-block', marginBottom: '32px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>SALE OPENS ON</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f97316' }}>{formatDateTime(match.ticket_sale_open_at)}</div>
        </div>

        <br/>
        <button className="mc-btn mc-btn-primary" style={{ padding: '12px 32px' }} onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    </section>
  )

  if (stands.length === 0) return (
    <section className="container page" style={{ paddingTop: '60px' }}>
      <EmptyState title="Sold Out" message="Sorry, this match is sold out." icon="🏟️" />
    </section>
  )

  const totalPrice = selections.reduce((acc, sel) => acc + sel.stand.price * sel.quantity, 0)
  const totalQuantity = selections.reduce((acc, sel) => acc + sel.quantity, 0)

  return (
    <section style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* ─── UNIFIED BREADCRUMB ─── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '20px 0', marginBottom: '40px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700 }}>
          <span 
            style={{ 
              color: step === 1 ? '#6366F1' : '#64748b', 
              cursor: step === 2 ? 'pointer' : 'default', 
              fontSize: '1.25rem',
              fontWeight: 900,
              transition: 'color 0.2s'
            }} 
            onClick={() => { if (step === 2) setStep(1) }}
          >
            Booking ticket
          </span>
          <span style={{ color: '#cbd5e1', fontSize: '1.2rem' }}>›</span>
          <span 
            style={{ 
              color: step === 2 ? '#6366F1' : '#64748b', 
              fontSize: '1.25rem', 
              fontWeight: 900,
              transition: 'color 0.2s'
            }}
          >
            Payment
          </span>
        </div>
      </div>

      {step === 2 ? (
        <CheckoutPage 
          checkoutDataProp={{
            matchId: Number(matchId),
            selections: selections.map(s => ({
              standId: s.stand.id,
              quantity: s.quantity,
              standName: `Section ${s.blockId}`,
              price: s.stand.price
            })),
            matchName: match?.home_team + ' - ' + match?.away_team
          }} 
          onBackProp={() => setStep(1)} 
        />
      ) : (
        <>
      {/* ─── HEADER CARD ─── */}
      <div className="container" style={{ paddingTop: '40px' }}>
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '40px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 800, 
            color: '#1e293b', 
            margin: 0,
            letterSpacing: '-1px'
          }}>
            {match?.home_team} - {match?.away_team}
          </h1>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '40px',
            flexWrap: 'wrap',
            color: '#64748b',
            fontSize: '0.9rem',
            fontWeight: 600
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>📍</span>
              {match?.stadium_name || 'Hang Day Stadium'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>📅</span>
              {match ? formatDateTime(match.match_date, 'dd/MM/yyyy') : '--/--/----'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>🕒</span>
              {match ? new Date(match.match_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN LAYOUT ─── */}
      <div className="container" style={{ paddingTop: '48px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.3fr 1fr',
          gap: '40px',
          alignItems: 'start'
        }}>
          
          {/* LEFT COLUMN: Stadium Map */}
          <div style={{ position: 'sticky', top: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>
                Stand Layout
              </h2>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: '#e2e8f0', borderRadius: '3px' }}></div>Sold Out</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: '#4f46e5', borderRadius: '3px' }}></div>Selected</div>
              </div>
            </div>
            
            <div style={{ 
              background: '#fff', 
              borderRadius: '24px', 
              padding: '32px', 
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)'
            }}>
              <StadiumMap
                stands={stands}
                selectedBlockIds={selections.map(s => s.blockId)}
                onSelectBlock={handleSelectBlock}
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Cart & Ticket List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            
            {/* 1. Selection Summary (Cart) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>
                  Selected Tickets
                </h2>
                {selections.length > 0 && (
                  <button 
                    onClick={() => {
                      setSelections([])
                      toast.success('Selection cleared')
                    }}
                    style={{ background: '#fee2e2', border: 'none', color: '#ef4444', padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fecaca'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fee2e2'}
                  >
                    <Trash2 size={16} />
                    Clear All
                  </button>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {selections.map((sel) => (
                  <div key={sel.blockId} style={{
                    padding: '24px',
                    background: '#1e293b',
                    borderRadius: '20px',
                    color: '#fff',
                    animation: 'fadeIn 0.3s ease-out',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Stand</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>Section {sel.blockId}</div>
                          <div style={{ fontSize: '0.9rem', color: '#cbd5e1', marginTop: '4px', fontWeight: 600 }}>{sel.tierName}</div>
                        </div>
                        <button 
                          onClick={() => setSelections(prev => prev.filter(s => s.blockId !== sel.blockId))}
                          style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '6px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', marginTop: '18px' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                          title="Remove"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Unit Price</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24' }}>{formatVND(sel.stand.price)}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, marginBottom: '8px' }}>QUANTITY</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '12px', width: 'fit-content' }}>
                          <button 
                            onClick={() => {
                              if (sel.quantity <= 1) {
                                setSelections(prev => prev.filter(s => s.blockId !== sel.blockId))
                              } else {
                                setSelections(prev => prev.map(s => s.blockId === sel.blockId ? { ...s, quantity: s.quantity - 1 } : s))
                              }
                            }}
                            style={{ background: 'transparent', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', transition: 'background 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <Minus size={20} />
                          </button>
                          <span style={{ fontSize: '1.2rem', fontWeight: 800, minWidth: '40px', textAlign: 'center' }}>{sel.quantity}</span>
                          <button 
                            onClick={() => {
                              const totalQty = selections.reduce((acc, s) => acc + s.quantity, 0)
                              if (totalQty >= 10) {
                                toast.error('Total quantity cannot exceed 10')
                                return
                              }
                              setSelections(prev => prev.map(s => s.blockId === sel.blockId ? { ...s, quantity: Math.min(sel.stand.available_seats, s.quantity + 1) } : s))
                            }} 
                            style={{ background: 'transparent', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Subtotal</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 950, color: '#fff' }}>{formatVND(sel.stand.price * sel.quantity)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {selections.length === 0 && (
                <div style={{ 
                  padding: '60px 40px', 
                  background: '#fff', 
                  borderRadius: '20px', 
                  border: '2px dashed #e2e8f0',
                  textAlign: 'center',
                  color: '#94a3b8'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎫</div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#475569' }}>No sections selected</h3>
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem' }}>Click on the stadium map to pick your seats (max 2 sections).</p>
                </div>
              )}

              {selections.length > 0 && (
                <div style={{ marginTop: '24px', textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>Total Price: <span style={{ fontSize: '1.5rem', color: '#1e293b', fontWeight: 900 }}>{formatVND(totalPrice)}</span></div>
                  <button 
                    onClick={continueCheckout}
                    style={{
                      width: '100%', marginTop: '24px', padding: '16px', background: '#3b82f6',
                      color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer',
                      fontSize: '1.1rem', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    Checkout Now →
                  </button>
                </div>
              )}
            </div>

            {/* 2. Ticket List */}
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b', marginBottom: '20px' }}>
                Detailed Pricing
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(() => {
                  const groupedStands = stands.reduce((acc, stand) => {
                    const [mainStand, tier] = stand.name.split('-')
                    if (!acc[mainStand]) {
                      acc[mainStand] = { price: stand.price, tiers: [], totalAvailable: 0 }
                    }
                    acc[mainStand].tiers.push({ ...stand, tierName: tier })
                    acc[mainStand].totalAvailable += stand.available_seats
                    return acc
                  }, {})

                  return Object.keys(groupedStands).sort().map(mainStand => {
                    const group = groupedStands[mainStand]
                    return (
                      <div key={mainStand} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#1e293b' }}>Stand {mainStand}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>{group.totalAvailable > 0 ? `${group.totalAvailable} tickets left` : 'Sold Out'}</div>
                          </div>
                          <div style={{ color: '#ef4444', fontWeight: 800, fontSize: '1.1rem' }}>{formatVND(group.price)}</div>
                        </div>
                        
                        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {group.tiers.sort((a, b) => a.tierName.localeCompare(b.tierName)).map(tier => (
                            <div 
                              key={tier.id}
                              onClick={() => handleSelectBlock({ stand: tier, blockId: tier.name, tierName: tier.tierName })}
                              style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '12px 16px', borderRadius: '10px',
                                border: selections.find(s => s.stand.id === tier.id) ? '2px solid #ef4444' : '1px solid transparent',
                                cursor: tier.available_seats > 0 ? 'pointer' : 'not-allowed',
                                background: tier.available_seats > 0 ? (selections.find(s => s.stand.id === tier.id) ? '#fef2f2' : '#f8fafc') : '#f1f5f9',
                                opacity: tier.available_seats > 0 ? 1 : 0.6,
                                transition: 'all 0.2s'
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 800, color: '#334155', fontSize: '0.95rem' }}>Floor {tier.tierName.replace('T', '')}</div>
                              </div>
                              {tier.available_seats > 0 ? (
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation()
                                    handleSelectBlock({ stand: tier, blockId: tier.name, tierName: tier.tierName })
                                  }}
                                  style={{ 
                                    padding: '6px 16px', background: selections.find(s => s.stand.id === tier.id) ? '#ef4444' : '#fff', 
                                    color: selections.find(s => s.stand.id === tier.id) ? '#fff' : '#ef4444', 
                                    border: '1px solid #ef4444', borderRadius: '8px', fontWeight: 800, cursor: 'pointer',
                                    fontSize: '0.85rem', transition: 'all 0.2s'
                                  }}
                                >
                                  Select
                                </button>
                              ) : (
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8' }}>Sold Out</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>

          </div>
        </div>
      </div>
        </>
      )}
    </section>
  )
}

