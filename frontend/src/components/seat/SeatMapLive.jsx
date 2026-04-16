import { SEAT_COLORS, STAND_COLORS } from '../../constants/seatColors'

export default function SeatMapLive({ seats, latestSeatId }) {
  return (
    <div className="seat-grid">
      {seats.map((seat) => {
        const isLatest = Number(seat.id) === Number(latestSeatId)
        const color = SEAT_COLORS[seat.status] ?? SEAT_COLORS.available

        return (
          <div
            key={seat.id}
            className={`seat seat-static ${isLatest ? 'seat-pulse' : ''}`}
            style={{ backgroundColor: color, borderColor: STAND_COLORS[seat.stand_name] ?? '#d1d5db' }}
            title={`${seat.seat_label} - ${seat.status}`}
          >
            {seat.seat_label}
          </div>
        )
      })}
    </div>
  )
}
