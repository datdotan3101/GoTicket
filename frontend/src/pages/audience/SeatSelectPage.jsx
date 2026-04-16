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
  const socketRef = useSocket({ enabled: true })
  const [seats, setSeats] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const selectedSeats = useSeatStore((state) => state.selectedSeats)
  const setSelectedSeats = useSeatStore((state) => state.setSelectedSeats)
  const clearSeats = useSeatStore((state) => state.clearSeats)

  useEffect(() => {
    clearSeats()
  }, [clearSeats, matchId])

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await matchService.getSeats(matchId)
        setSeats(unwrapData(response) ?? [])
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể tải sơ đồ ghế')
        setSeats([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSeats()
  }, [matchId])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return undefined

    socket.emit('join:match', Number(matchId))

    const onSeatBooked = ({ seatId }) => {
      setSeats((prev) => prev.map((seat) => (seat.id === seatId ? { ...seat, status: 'booked' } : seat)))
      setSelectedSeats((prev) => prev.filter((seat) => seat.id !== seatId))
    }

    socket.on('seat:booked', onSeatBooked)
    socket.on('seat:paid', onSeatBooked)

    return () => {
      socket.off('seat:booked', onSeatBooked)
      socket.off('seat:paid', onSeatBooked)
    }
  }, [matchId, setSelectedSeats, socketRef])

  const toggleSeat = (seat) => {
    const exists = selectedSeats.some((item) => item.id === seat.id)
    const next = exists ? selectedSeats.filter((item) => item.id !== seat.id) : [...selectedSeats, seat]
    setSelectedSeats(next)
  }

  const selectedTotal = useMemo(
    () => selectedSeats.reduce((sum, seat) => sum + Number(seat.price || 0), 0),
    [selectedSeats],
  )

  const continueCheckout = () => {
    const validation = validateSelectedSeats(selectedSeats)
    if (!validation.valid) {
      toast.error(validation.message)
      return
    }

    navigate('/audience/checkout', {
      state: {
        matchId: Number(matchId),
        seatIds: selectedSeats.map((seat) => seat.id),
        seats: selectedSeats,
      },
    })
  }

  return (
    <section className="container page" aria-label="Lựa chọn ghế ngồi">
      <h1 className="text-2xl font-bold mb-4">Lựa chọn ghế ngồi</h1>
      
      {isLoading && <LoadingSpinner text="Đang tải sơ đồ ghế..." />}

      {error && !isLoading && (
        <ErrorState
          title="Lỗi tải dữ liệu"
          message={error}
          onRetry={() => window.location.reload()}
        />
      )}

      {!isLoading && !error && seats.length === 0 && (
        <EmptyState title="Sơ đồ trống" message="Chưa có thông tin ghế ngồi cho trận đấu này." icon="🏟️" />
      )}

      {!isLoading && !error && seats.length > 0 && (
        <div className="flex flex-col gap-6">
          <SeatLegend />
          <div aria-live="polite" className="sr-only">
             Đã chọn {selectedSeats.length} ghế.
          </div>
          <SeatMap seats={seats} selectedSeats={selectedSeats} onToggleSeat={toggleSeat} />
          
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg flex items-center justify-between">
             <div className="text-lg">
                <span className="text-gray-500">Số lượng:</span> <strong className="text-blue-700">{selectedSeats.length} ghế</strong>
             </div>
             <div className="text-lg">
                <span className="text-gray-500">Tạm tính:</span> <strong className="text-green-700">{selectedTotal.toLocaleString('vi-VN')} VND</strong>
             </div>
          </div>

          <div className="flex gap-4">
            <Link className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors" to={`/matches/${matchId}`}>
              Quay lại trận đấu
            </Link>
            <button 
              type="button" 
              onClick={continueCheckout}
              disabled={selectedSeats.length === 0}
              className={`flex-1 px-6 py-3 rounded-lg font-bold transition-colors ${
                selectedSeats.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Tiến hành thanh toán
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
