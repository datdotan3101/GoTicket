import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Activity, Info } from 'lucide-react'
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
    <div className="checker-dashboard-premium">
      <div className="checker-header">
        <div className="container">
          <div className="checker-header-inner">
            <div className="checker-title-section">
              <Link to="/checker" className="flex items-center gap-2 text-slate-500 font-semibold text-sm mb-4 hover:text-slate-900 transition-colors">
                <ChevronLeft size={16} />
                <span>Return to Dashboard</span>
              </Link>
              <div className="flex items-center gap-3">
                <div className="checker-badge">
                  <Activity size={14} className="pulse-icon" />
                  <span>Live Map</span>
                </div>
              </div>
              <h1>Live Attendance Map</h1>
              <p>Visualizing real-time entry and seat occupancy for Match #{matchId}</p>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3 max-w-sm">
              <Info className="text-blue-500 shrink-0" size={20} />
              <p className="text-blue-800 text-xs leading-relaxed font-medium">
                Seats will pulse in <span className="text-blue-600 font-bold">Blue</span> when a guest checks in. 
                Occupancy data is updated every second.
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="container">
        <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm">
          <div className="mb-8">
            <SeatLegend />
          </div>
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <SeatMapLive seats={seats} latestSeatId={latestSeatId} />
          </div>
        </div>
      </main>
    </div>
  )
}
