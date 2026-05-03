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

export default function SeatSelectPage() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const [stands, setStands] = useState([])
  const [selectedStand, setSelectedStand] = useState(null)
  const [match, setMatch] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

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

  const handleSelectStand = (stand) => {
    if (!stand || stand.available_seats === 0) return
    setSelectedStand(stand)
    if (quantity > stand.available_seats) {
      setQuantity(Math.min(stand.available_seats, 6))
    }
  }

  const continueCheckout = () => {
    if (!selectedStand) {
      toast.error('Please select a stand')
      return
    }
    navigate('/audience/checkout', {
      state: {
        matchId: Number(matchId),
        standId: selectedStand.id,
        quantity: Number(quantity),
        standName: selectedStand.name,
        price: selectedStand.price,
      },
    })
  }

  if (isLoading) return (
    <section className="container page" style={{ paddingTop: '60px' }}>
      <LoadingSpinner text="Checking seat availability..." />
    </section>
  )

  if (error) return (
    <section className="container page" style={{ paddingTop: '60px' }}>
      <ErrorState title="Data loading error" message={error} onRetry={() => window.location.reload()} />
    </section>
  )

  if (stands.length === 0) return (
    <section className="container page" style={{ paddingTop: '60px' }}>
      <EmptyState title="Sold Out" message="Sorry, this match is sold out across all stands." icon="🏟️" />
    </section>
  )

  const totalPrice = (selectedStand?.price || 0) * quantity

  return (
    <section style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* ─── IMAGE 1: PREMUM HEADER CARD ─── */}
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

      {/* ─── IMAGE 2: MAIN LAYOUT ─── */}
      <div className="container" style={{ paddingTop: '48px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr',
          gap: '48px',
          alignItems: 'start'
        }}>
          
          {/* LEFT: Stadium Map */}
          <div>
            <h2 style={{ 
              fontSize: '1.75rem', 
              fontWeight: 800, 
              color: '#1e293b', 
              textAlign: 'center',
              marginBottom: '32px'
            }}>
              {match?.stadium_name || 'Sân vận động Hàng Đẫy Hà Nội'}
            </h2>
            
            <div style={{ 
              background: '#fff', 
              borderRadius: '16px', 
              padding: '24px', 
              border: '1px solid #e2e8f0' 
            }}>
              <StadiumMap
                stands={stands}
                selectedStandId={selectedStand?.id}
                onSelectStand={handleSelectStand}
              />
            </div>
          </div>

          {/* RIGHT: Ticket List */}
          <div>
            <h2 style={{ 
              fontSize: '1.75rem', 
              fontWeight: 800, 
              color: '#1e293b', 
              textAlign: 'center',
              marginBottom: '32px'
            }}>
              Danh sách vé
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Header for the list if needed or just the stands */}
              <div style={{
                background: '#f8d7da',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#721c24',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>Các vé khác</span>
                <span>▼</span>
              </div>

              {stands.map(stand => (
                <div 
                  key={stand.id}
                  onClick={() => handleSelectStand(stand)}
                  style={{
                    background: '#fff',
                    borderRadius: '12px',
                    border: `1px solid ${selectedStand?.id === stand.id ? '#ef4444' : '#e2e8f0'}`,
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: stand.available_seats > 0 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Status Bar */}
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    background: stand.available_seats > 0 ? '#22c55e' : '#cbd5e1'
                  }} />

                  {/* Logo Placeholder */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    background: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: '0.8rem'
                  }}>
                    ⚽
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>
                      {stand.name.startsWith('Stand') ? stand.name : `Stand ${stand.name}`}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
                      {formatVND(stand.price)} <span style={{ fontSize: '0.75rem' }}>( Gồm 8% VAT )</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button style={{ 
                      width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #e2e8f0',
                      background: '#fff', color: '#ef4444', fontWeight: 800, cursor: 'pointer'
                    }}>i</button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleSelectStand(stand); continueCheckout(); }}
                      style={{ 
                        width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #ef4444',
                        background: '#fff', color: '#ef4444', fontWeight: 800, cursor: 'pointer'
                      }}
                    >🛒</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Selection Summary (Keep original style but integrated) */}
            {selectedStand && (
              <div style={{
                marginTop: '32px',
                padding: '24px',
                background: '#1e293b',
                borderRadius: '16px',
                color: '#fff',
                animation: 'fadeIn 0.3s ease-out'
              }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.6, textTransform: 'uppercase', marginBottom: '8px' }}>Bạn đã chọn</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{selectedStand.name}</div>
                
                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Số lượng</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                      <button onClick={() => setQuantity(q => Math.max(1, q-1))} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer' }}>-</button>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{quantity}</span>
                      <button onClick={() => setQuantity(q => Math.min(6, selectedStand.available_seats, q+1))} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer' }}>+</button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Tổng cộng</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fbbf24' }}>{formatVND(totalPrice)}</div>
                  </div>
                </div>

                <button 
                  onClick={continueCheckout}
                  style={{
                    width: '100%', marginTop: '24px', padding: '16px', background: '#3b82f6',
                    color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  Thanh toán ngay →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
