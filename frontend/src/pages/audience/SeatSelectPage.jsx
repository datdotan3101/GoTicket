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
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await matchService.getAvailability(matchId)
        setStands(unwrapData(response) ?? [])
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể tải thông tin khán đài')
        setStands([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchAvailability()
  }, [matchId])

  const handleSelectStand = (stand) => {
    if (!stand || stand.available_seats === 0) return
    setSelectedStand(stand)
    if (quantity > stand.available_seats) {
      setQuantity(Math.min(stand.available_seats, 4))
    }
  }

  const continueCheckout = () => {
    if (!selectedStand) {
      toast.error('Vui lòng chọn khán đài')
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
      <LoadingSpinner text="Đang kiểm tra chỗ trống..." />
    </section>
  )

  if (error) return (
    <section className="container page" style={{ paddingTop: '60px' }}>
      <ErrorState title="Lỗi tải dữ liệu" message={error} onRetry={() => window.location.reload()} />
    </section>
  )

  if (stands.length === 0) return (
    <section className="container page" style={{ paddingTop: '60px' }}>
      <EmptyState title="Hết vé" message="Rất tiếc, trận đấu này đã hết vé ở tất cả các khán đài." icon="🏟️" />
    </section>
  )

  const totalPrice = (selectedStand?.price || 0) * quantity

  return (
    <section style={{ background: '#f1f5f9', minHeight: '100vh', padding: '0 0 60px 0' }}>
      {/* Page Header */}
      <div style={{ background: '#0f172a', color: '#fff', padding: '28px 0' }}>
        <div className="container">
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.5px' }}>
            🏟️ Chọn Khán Đài
          </h1>
          <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            Nhấp vào khu vực trên sơ đồ sân hoặc danh sách bên phải để chọn vé.
          </p>
        </div>
      </div>

      {/* Main Content: 2 columns */}
      <div className="container" style={{ paddingTop: '32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.6fr) minmax(300px, 1fr)',
          gap: '28px',
          alignItems: 'start',
        }}>

          {/* ─── LEFT: Stadium Map ─── */}
          <div>
            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Sơ đồ sân
              </span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>
            <StadiumMap
              stands={stands}
              selectedStandId={selectedStand?.id}
              onSelectStand={handleSelectStand}
            />

            {/* Stand list as pills for quick reference */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '16px' }}>
              {stands.map((stand) => {
                const soldOut = stand.available_seats === 0
                const sel = selectedStand?.id === stand.id
                return (
                  <button
                    key={stand.id}
                    onClick={() => handleSelectStand(stand)}
                    disabled={soldOut}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '99px',
                      border: `1.5px solid ${sel ? '#4f46e5' : soldOut ? '#e2e8f0' : '#cbd5e1'}`,
                      background: sel ? '#4f46e5' : soldOut ? '#f8fafc' : '#fff',
                      color: sel ? '#fff' : soldOut ? '#94a3b8' : '#334155',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: soldOut ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: soldOut ? 0.6 : 1,
                    }}
                  >
                    {stand.name === 'VIP' ? '💎 VIP' : `Khán đài ${stand.name}`}
                    {soldOut && ' — Hết vé'}
                    {!soldOut && ` (${stand.available_seats.toLocaleString()} chỗ)`}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ─── RIGHT: Booking Panel ─── */}
          <div style={{ position: 'sticky', top: '24px' }}>
            {/* Stand details */}
            {selectedStand ? (
              <div style={{
                background: '#fff',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              }}>
                {/* Stand banner */}
                <div style={{
                  background: selectedStand.name === 'VIP'
                    ? 'linear-gradient(135deg, #312e81, #4f46e5)'
                    : 'linear-gradient(135deg, #1e293b, #334155)',
                  padding: '24px',
                  color: '#fff',
                }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '2px', opacity: 0.7, marginBottom: '6px' }}>
                    KHÁN ĐÀI ĐÃ CHỌN
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px' }}>
                    {selectedStand.name === 'VIP' ? '💎 VIP' : `Khán đài ${selectedStand.name}`}
                  </div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '6px' }}>
                    {selectedStand.available_seats.toLocaleString()} chỗ trống
                  </div>
                </div>

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Price per ticket */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Giá mỗi vé</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                      {formatVND(selectedStand.price)}
                    </span>
                  </div>

                  {/* Quantity selector */}
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '12px' }}>
                      Số lượng vé
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        style={{
                          width: '48px', height: '48px', border: 'none', background: '#f8fafc',
                          fontWeight: 900, fontSize: '1.25rem', cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                          color: quantity <= 1 ? '#cbd5e1' : '#334155', transition: 'background 0.2s',
                        }}
                      >−</button>
                      <span style={{ flex: 1, textAlign: 'center', fontWeight: 900, fontSize: '1.5rem', color: '#0f172a' }}>
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(4, selectedStand.available_seats, q + 1))}
                        disabled={quantity >= 4 || quantity >= selectedStand.available_seats}
                        style={{
                          width: '48px', height: '48px', border: 'none', background: '#f8fafc',
                          fontWeight: 900, fontSize: '1.25rem',
                          cursor: quantity >= 4 || quantity >= selectedStand.available_seats ? 'not-allowed' : 'pointer',
                          color: quantity >= 4 || quantity >= selectedStand.available_seats ? '#cbd5e1' : '#334155',
                          transition: 'background 0.2s',
                        }}
                      >+</button>
                    </div>
                    <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '8px', textAlign: 'center', fontStyle: 'italic' }}>
                      * Tối đa 4 vé mỗi lần đặt
                    </p>
                  </div>

                  {/* Total */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <span style={{ color: '#475569', fontWeight: 700 }}>Tổng cộng</span>
                      <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#4f46e5' }}>
                        {formatVND(totalPrice)}
                      </span>
                    </div>
                    <button
                      onClick={continueCheckout}
                      style={{
                        width: '100%', padding: '16px', background: '#0f172a', color: '#fff',
                        border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '1rem',
                        cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.5px',
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                      onMouseOut={(e) => { e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.transform = 'translateY(0)' }}
                    >
                      Tiếp theo →
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Placeholder when nothing selected */
              <div style={{
                background: '#fff',
                borderRadius: '20px',
                border: '2px dashed #cbd5e1',
                padding: '40px 24px',
                textAlign: 'center',
                color: '#94a3b8',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏟️</div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#475569', marginBottom: '6px' }}>
                  Chưa chọn khán đài
                </div>
                <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                  Nhấp vào một khu vực trên sơ đồ sân hoặc sử dụng các nút phía dưới để bắt đầu.
                </div>

                {/* Quick stand buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '24px' }}>
                  {stands.filter(s => s.available_seats > 0).map(stand => (
                    <button
                      key={stand.id}
                      onClick={() => handleSelectStand(stand)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        color: '#334155',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s',
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#4f46e5' }}
                      onMouseOut={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0' }}
                    >
                      <span>{stand.name === 'VIP' ? '💎 VIP' : `Khán đài ${stand.name}`}</span>
                      <span style={{ color: '#4f46e5', fontWeight: 900 }}>{formatVND(stand.price)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  )
}
