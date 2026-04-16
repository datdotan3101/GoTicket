import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import SeatLegend from '../../components/seat/SeatLegend'
import SeatMapLive from '../../components/seat/SeatMapLive'
import { useSocket } from '../../hooks/useSocket'
import { matchService } from '../../services/matchService'
import { unwrapData } from '../../utils/apiData'

export default function LiveSeatMapPage() {
  const { matchId } = useParams()
  const socketRef = useSocket({ enabled: true })
  const [seats, setSeats] = useState([])
  const [latestSeatId, setLatestSeatId] = useState(null)

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const response = await matchService.getSeats(matchId)
        setSeats(unwrapData(response) || [])
      } catch {
        setSeats([])
      }
    }

    fetchSeats()
  }, [matchId])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return undefined

    socket.emit('join:match', Number(matchId))

    const onSeatCheckedIn = (payload) => {
      setLatestSeatId(payload.seatId)
      setSeats((prev) =>
        prev.map((seat) =>
          Number(seat.id) === Number(payload.seatId) ? { ...seat, status: 'checked_in' } : seat,
        ),
      )
    }

    socket.on('seat:checked_in', onSeatCheckedIn)

    return () => {
      socket.off('seat:checked_in', onSeatCheckedIn)
    }
  }, [matchId, socketRef])

  return (
    <section className="container page">
      <h1>Live Seat Map - Match #{matchId}</h1>
      <SeatLegend />
      <SeatMapLive seats={seats} latestSeatId={latestSeatId} />
    </section>
  )
}
