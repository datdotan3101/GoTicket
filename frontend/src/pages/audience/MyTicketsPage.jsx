import { useEffect, useState } from 'react'
import TicketCard from '../../components/ui/TicketCard'
import { ticketService } from '../../services/ticketService'
import { unwrapData } from '../../utils/apiData'

import { MOCK_TICKETS } from '../../constants/mocks'

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState(MOCK_TICKETS)

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await ticketService.getMyTickets()
        const fetchedTickets = unwrapData(response) ?? []
        setTickets([...MOCK_TICKETS, ...fetchedTickets])
      } catch {
        setTickets(MOCK_TICKETS)
      }
    }

    fetchTickets()
  }, [])

  return (
    <section className="container page">
      <h1>My tickets</h1>
      <div className="cards-grid">
        {tickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)}
      </div>
      {tickets.length === 0 && <p>No tickets.</p>}
    </section>
  )
}
