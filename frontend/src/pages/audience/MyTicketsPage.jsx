import { useEffect, useState } from 'react'
import TicketCard from '../../components/ui/TicketCard'
import { ticketService } from '../../services/ticketService'
import { unwrapData } from '../../utils/apiData'

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([])
  const [activeTab, setActiveTab] = useState('upcoming')

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await ticketService.getMyTickets()
        const fetchedTickets = unwrapData(response) ?? []
        setTickets(fetchedTickets)
      } catch {
        setTickets([])
      }
    }

    fetchTickets()
  }, [])

  const now = new Date()
  const upcomingTickets = tickets.filter((ticket) => new Date(ticket.match_date) >= now)
  const pastTickets = tickets.filter((ticket) => new Date(ticket.match_date) < now)

  return (
    <section className="container page py-10">
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-8 uppercase tracking-tight border-b border-slate-200 pb-4">
        My Tickets
      </h1>
      
      {tickets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-gray-500 text-lg">You don't have any tickets yet.</p>
        </div>
      ) : (
        <div>
          {/* Tabs - Segmented Control Style */}
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl mb-10 gap-1 border border-slate-200/60 shadow-sm">
            <button
              onClick={() => setActiveTab('upcoming')}
              style={{ 
                background: activeTab === 'upcoming' ? 'var(--color-primary-600)' : 'transparent',
                color: activeTab === 'upcoming' ? 'white' : 'var(--color-slate-500)',
                border: 'none'
              }}
              className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeTab === 'upcoming' ? 'shadow-md' : 'hover:bg-slate-200/50'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab('past')}
              style={{ 
                background: activeTab === 'past' ? 'var(--color-primary-600)' : 'transparent',
                color: activeTab === 'past' ? 'white' : 'var(--color-slate-500)',
                border: 'none'
              }}
              className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeTab === 'past' ? 'shadow-md' : 'hover:bg-slate-200/50'
              }`}
            >
              Past Matches
            </button>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'upcoming' ? (
              upcomingTickets.length === 0 ? (
                <div className="py-12 text-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No upcoming tickets.</p>
                </div>
              ) : (
                <div className="cards-grid">
                  {upcomingTickets.map((ticket) => (
                    <TicketCard key={ticket.ticket_code} ticket={ticket} />
                  ))}
                </div>
              )
            ) : (
              pastTickets.length === 0 ? (
                <div className="py-12 text-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No past tickets.</p>
                </div>
              ) : (
                <div className="cards-grid opacity-80 hover:opacity-100 transition-opacity">
                  {pastTickets.map((ticket) => (
                    <div key={ticket.ticket_code} className="grayscale-20">
                      <TicketCard ticket={ticket} />
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </section>
  )
}
