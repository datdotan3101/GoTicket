import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import StadiumMap from '../../components/seat/StadiumMap'
import { matchService } from '../../services/matchService'
import { unwrapData } from '../../utils/apiData'
import { formatVND } from '../../utils/formatCurrency'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import CheckoutPage from './CheckoutPage'

export default function SeatSelectPage() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const [stands, setStands] = useState([])
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [match, setMatch] = useState(null)
  const [quantity, setQuantity] = useState(1)
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

    if (selectedBlock?.blockId === blockId) {
      if (quantity >= 10) {
        toast.error('Mỗi lần chỉ được phép mua tối đa 10 vé')
        return
      }
      setQuantity(q => Math.min(q + 1, stand.available_seats, 10))
    } else {
      setSelectedBlock({ stand, blockId, tierName })
      setQuantity(1)
    }
  }

  const handleListSelectStand = (stand) => {
    if (!stand || stand.available_seats === 0) return
    const blockId = stand.name
    const tierName = blockId.endsWith('T2') ? 'Tầng 2' : 'Tầng 1'
    handleSelectBlock({ stand, blockId, tierName })
  }

  const continueCheckout = () => {
    if (!selectedBlock) {
      toast.error('Vui lòng chọn một khu vực ghế')
      return
    }
    setStep(2)
  }

  if (isLoading) return (
    <section className="container page" style={{ paddingTop: '60px' }}>
      <LoadingSpinner text="Đang tải sơ đồ ghế..." />
    </section>
  )

  if (error) return (
    <section className="container page" style={{ paddingTop: '60px' }}>
      <ErrorState title="Lỗi tải dữ liệu" message={error} onRetry={() => window.location.reload()} />
    </section>
  )

  if (stands.length === 0) return (
    <section className="container page" style={{ paddingTop: '60px' }}>
      <EmptyState title="Sold Out" message="Rất tiếc, trận đấu này đã bán hết vé." icon="🏟️" />
    </section>
  )

  const totalPrice = (selectedBlock?.stand?.price || 0) * quantity

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
            standId: selectedBlock.stand.id,
            quantity: Number(quantity),
            standName: `Khu vực ${selectedBlock.blockId}`,
            price: selectedBlock.stand.price,
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
              {match?.stadium_name || 'Sân vận động Hàng Đẫy'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>📅</span>
              {match ? new Date(match.match_date).toLocaleDateString('vi-VN') : '--/--/----'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>🕒</span>
              {match ? new Date(match.match_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#3b82f6' }}>
              <span style={{ fontSize: '1.1rem' }}>📅+</span>
              Thêm vào lịch
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
                Sơ đồ khán đài
              </h2>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: '#e2e8f0', borderRadius: '3px' }}></div>Đã bán hết</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: '#4f46e5', borderRadius: '3px' }}></div>Đang chọn</div>
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
                selectedBlockId={selectedBlock?.blockId}
                onSelectBlock={handleSelectBlock}
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Cart & Ticket List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            
            {/* 1. Selection Summary (Cart) */}
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b', marginBottom: '20px' }}>
                Vé đang chọn
              </h2>
              
              {selectedBlock ? (
                <div style={{
                  padding: '24px',
                  background: '#1e293b',
                  borderRadius: '20px',
                  color: '#fff',
                  animation: 'fadeIn 0.3s ease-out',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px', marginBottom: '20px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Khán đài</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>Khu vực {selectedBlock.blockId}</div>
                      <div style={{ fontSize: '0.9rem', color: '#cbd5e1', marginTop: '4px', fontWeight: 600 }}>{selectedBlock.tierName}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Đơn giá</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24' }}>{formatVND(selectedBlock.stand.price)}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, marginBottom: '8px' }}>SỐ LƯỢNG</div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '4px' }}>
                        <button onClick={() => setQuantity(q => Math.max(1, q-1))} style={{ background: 'transparent', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>-</button>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800, minWidth: '40px', textAlign: 'center' }}>{quantity}</span>
                        <button 
                          onClick={() => {
                            if (quantity >= 10) toast.error('Mỗi lần chỉ được phép mua tối đa 10 vé')
                            else setQuantity(q => Math.min(10, selectedBlock.stand.available_seats, q+1))
                          }} 
                          style={{ background: 'transparent', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', transition: 'background 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}
                        >+</button>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>TỔNG CỘNG</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fbbf24' }}>{formatVND(totalPrice)}</div>
                    </div>
                  </div>

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
                    Thanh toán ngay →
                  </button>
                </div>
              ) : (
                <div style={{ 
                  padding: '40px 24px', textAlign: 'center', background: '#fff', borderRadius: '20px', 
                  border: '2px dashed #cbd5e1', color: '#64748b'
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🏟️</div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#334155', marginBottom: '4px' }}>Chưa chọn vé</div>
                  <div style={{ fontSize: '0.9rem' }}>Vui lòng chọn một khu vực trên sơ đồ hoặc danh sách bên dưới.</div>
                </div>
              )}
            </div>

            {/* 2. Ticket List */}
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b', marginBottom: '20px' }}>
                Bảng giá chi tiết
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
                            <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#1e293b' }}>Khán đài {mainStand}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>{group.totalAvailable > 0 ? `Còn ${group.totalAvailable} vé` : 'Hết vé'}</div>
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
                                border: selectedBlock?.stand?.id === tier.id ? '2px solid #ef4444' : '1px solid transparent',
                                cursor: tier.available_seats > 0 ? 'pointer' : 'not-allowed',
                                background: tier.available_seats > 0 ? (selectedBlock?.stand?.id === tier.id ? '#fef2f2' : '#f8fafc') : '#f1f5f9',
                                opacity: tier.available_seats > 0 ? 1 : 0.6,
                                transition: 'all 0.2s'
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 800, color: '#334155', fontSize: '0.95rem' }}>Tầng {tier.tierName.replace('T', '')}</div>
                              </div>
                              {tier.available_seats > 0 ? (
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation()
                                    handleSelectBlock({ stand: tier, blockId: tier.name, tierName: tier.tierName })
                                    setTimeout(continueCheckout, 50)
                                  }}
                                  style={{ 
                                    padding: '6px 16px', background: selectedBlock?.stand?.id === tier.id ? '#ef4444' : '#fff', 
                                    color: selectedBlock?.stand?.id === tier.id ? '#fff' : '#ef4444', 
                                    border: '1px solid #ef4444', borderRadius: '8px', fontWeight: 800, cursor: 'pointer',
                                    fontSize: '0.85rem', transition: 'all 0.2s'
                                  }}
                                >
                                  Chọn
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

