import { SEAT_COLORS } from '../../constants/seatColors'

export default function SeatLegend() {
  return (
    <div className="legend-wrap">
      {Object.entries(SEAT_COLORS).map(([status, color]) => (
        <div key={status} className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: color }} />
          <span>{status}</span>
        </div>
      ))}
    </div>
  )
}
