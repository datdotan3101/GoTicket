import { SEAT_COLORS, STAND_COLORS } from '../../constants/seatColors'

export default function SeatMap({ seats, selectedSeats, onToggleSeat }) {
  return (
    <div className="seat-grid">
      {seats.map((seat) => {
        const isSelected = selectedSeats.some((item) => item.id === seat.id)
        const isBlocked = seat.status !== 'available'
        const baseColor = isSelected ? SEAT_COLORS.mine : SEAT_COLORS[seat.status] ?? SEAT_COLORS.available

        return (
          <button
            key={seat.id}
            type="button"
            className="seat"
            style={{ backgroundColor: baseColor, borderColor: STAND_COLORS[seat.stand_name] ?? '#d1d5db' }}
            disabled={isBlocked}
            onClick={() => onToggleSeat(seat)}
            title={`${seat.seat_label} - ${seat.stand_name}`}
          >
            {seat.seat_label}
          </button>
        )
      })}
    </div>
  )
}
