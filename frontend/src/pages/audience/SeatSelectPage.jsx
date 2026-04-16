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

export default function SeatSelectPage() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const socketRef = useSocket({ enabled: true })
  const [seats, setSeats] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const selectedSeats = useSeatStore((state) => state.selectedSeats)
  const setSelectedSeats = useSeatStore((state) => state.setSelectedSeats)
  const clearSeats = useSeatStore((state) => state.clearSeats)

  useEffect(() => {
    clearSeats()
  }, [clearSeats, matchId])

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const response = await matchService.getSeats(matchId)
        setSeats(unwrapData(response) ?? [])
      } catch {
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
    <section className="container page">
      <h1>Seat selection</h1>
      {isLoading && <p>Loading seat map...</p>}
      {!isLoading && (
        <>
          <SeatLegend />
          <SeatMap seats={seats} selectedSeats={selectedSeats} onToggleSeat={toggleSeat} />
          <p>Selected: {selectedSeats.length} seat(s) - Total: {selectedTotal.toLocaleString('vi-VN')} VND</p>
          <div className="row-gap">
            <button type="button" onClick={continueCheckout}>Continue to checkout</button>
            <Link className="link-button" to={`/matches/${matchId}`}>Back to match</Link>
          </div>
        </>
      )}
    </section>
  )
}
