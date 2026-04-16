import { formatDateTime } from '../../utils/formatDate'

export default function TicketCard({ ticket }) {
  return (
    <article className="card">
      <h3>{ticket.home_team} vs {ticket.away_team}</h3>
      <p>Match: {formatDateTime(ticket.match_date)}</p>
      <p>Seat: {ticket.seat_label}</p>
      <p>Status: {ticket.status}</p>
      {ticket.qr_token && <p className="qr-inline">QR token: {ticket.qr_token.slice(0, 24)}...</p>}
    </article>
  )
}
