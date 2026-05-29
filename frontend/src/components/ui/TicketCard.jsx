import { Link } from 'react-router-dom'
import { formatDateTime } from '../../utils/formatters'
import { APP_ROUTES } from '../../constants/routes'

export default function TicketCard({ ticket }) {
  const detailUrl = APP_ROUTES.TICKET_DETAIL.replace(':ticketId', ticket.ticket_code)

  return (
    <Link to={detailUrl} className="block no-underline">
      <article className="card hover:border-blue-500 hover:shadow-md transition-all cursor-pointer bg-white">
        <div className="mb-2">
          <h3 className="font-bold text-gray-900 line-clamp-1">{ticket.home_team} vs {ticket.away_team}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-2">Match: {formatDateTime(ticket.match_date)}</p>
        <div className="flex flex-col gap-1 border-t border-gray-100 pt-3">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 uppercase tracking-wider font-bold">Sections</span>
            <span className="font-black text-gray-900">
              {(ticket.sections || []).map(s => s.name).join(', ')}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 uppercase tracking-wider font-bold">Total Tickets</span>
            <span className="font-bold text-gray-900">{ticket.total_quantity}</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
