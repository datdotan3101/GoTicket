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
    <section className="container page py-10">
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-8 uppercase tracking-tight border-b border-slate-200 pb-4">
        My Tickets
      </h1>
      <div className="cards-grid mt-6">
        {tickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)}
      </div>
      {tickets.length === 0 && <p>No tickets.</p>}
    </section>
  )
}
