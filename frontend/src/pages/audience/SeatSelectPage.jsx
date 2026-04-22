import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import SeatMap from '../../components/seat/SeatMap'
import SeatLegend from '../../components/seat/SeatLegend'
import { useSocket } from '../../hooks/useSocket'
import { matchService } from '../../services/matchService'
import { useSeatStore } from '../../store/seatStore'
import { validateSelectedSeats } from '../../utils/seatValidation'
import { unwrapData } from '../../utils/apiData'
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
    if (stand.available_seats === 0) return
    setSelectedStand(stand)
    if (quantity > stand.available_seats) {
      setQuantity(stand.available_seats > 4 ? 4 : stand.available_seats)
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

  return (
    <section className="container page py-10" aria-label="Lựa chọn chỗ ngồi">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Chọn Khán đài</h1>
        <p className="text-gray-500 mb-8">Vui lòng chọn khán đài và số lượng vé bạn muốn mua.</p>
        
        {isLoading && <LoadingSpinner text="Đang kiểm tra chỗ trống..." />}

        {error && !isLoading && (
          <ErrorState
            title="Lỗi tải dữ liệu"
            message={error}
            onRetry={() => window.location.reload()}
          />
        )}

        {!isLoading && !error && stands.length === 0 && (
          <EmptyState title="Hết vé" message="Rất tiếc, trận đấu này đã hết vé ở tất cả các khán đài." icon="🏟️" />
        )}

        {!isLoading && !error && stands.length > 0 && (
          <div className="grid gap-8 md:grid-cols-3">
            {/* Stand List */}
            <div className="md:col-span-2 space-y-4">
              {stands.map((stand) => {
                const isSoldOut = stand.available_seats === 0
                const isSelected = selectedStand?.id === stand.id
                
                return (
                  <button
                    key={stand.id}
                    disabled={isSoldOut}
                    onClick={() => handleSelectStand(stand)}
                    className={`w-full flex items-center justify-between p-6 rounded-2xl border-2 transition-all text-left ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-100' 
                        : isSoldOut 
                          ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed' 
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">Khán đài {stand.name}</h3>
                      <p className={`text-sm font-medium ${isSoldOut ? 'text-red-500' : 'text-blue-600'}`}>
                        {isSoldOut ? 'Hết vé (Sold out)' : `${stand.available_seats.toLocaleString()} chỗ trống`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-gray-900">
                        {Number(stand.price).toLocaleString('vi-VN')}đ
                      </p>
                      <p className="text-xs text-gray-400">mỗi vé</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Selection Summary */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm h-fit sticky top-24">
              <h4 className="text-lg font-bold text-gray-900 mb-6">Chi tiết đặt vé</h4>
              
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Số lượng vé</label>
                  <div className="flex items-center gap-4">
                    <button 
                      className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                    >-</button>
                    <span className="text-xl font-bold w-4 text-center">{quantity}</span>
                    <button 
                      className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30"
                      onClick={() => setQuantity(q => Math.min(selectedStand?.available_seats || 4, 4, q + 1))}
                      disabled={quantity >= 4 || quantity >= (selectedStand?.available_seats || 1)}
                    >+</button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 italic">* Tối đa 4 vé mỗi lần đặt</p>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <div className="flex justify-between items-end mb-6">
                    <p className="text-gray-500 font-medium">Tổng cộng</p>
                    <p className="text-2xl font-black text-blue-700">
                      {((selectedStand?.price || 0) * quantity).toLocaleString('vi-VN')}đ
                    </p>
                  </div>

                  <button 
                    onClick={continueCheckout}
                    disabled={!selectedStand}
                    className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg disabled:bg-gray-200 disabled:shadow-none active:scale-95"
                  >
                    Tiếp theo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
