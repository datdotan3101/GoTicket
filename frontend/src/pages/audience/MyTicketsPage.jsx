import { useEffect, useMemo, useState } from 'react'
import TicketCard from '../../components/ui/TicketCard'
import { ticketService } from '../../services/ticketService'
import { unwrapData } from '../../utils/apiData'

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await ticketService.getMyTickets()
        setTickets(unwrapData(response) ?? [])
      } catch {
        setTickets([])
      }
    }

    fetchTickets()
  }, [])

  const filteredTickets = useMemo(() => {
    if (statusFilter === 'all') return tickets
    return tickets.filter((ticket) => ticket.status === statusFilter)
  }, [statusFilter, tickets])

  return (
    <section className="container page">
      <h1>My tickets</h1>
      <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
        <option value="all">All</option>
        <option value="pending">Pending</option>
        <option value="paid">Paid</option>
        <option value="checked_in">Checked in</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <div className="cards-grid">
        {filteredTickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)}
      </div>
      {filteredTickets.length === 0 && <p>No tickets.</p>}
    </section>
  )
}
