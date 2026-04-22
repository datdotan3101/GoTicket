import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import QRCode from 'react-qr-code'
import { ticketService } from '../../services/ticketService'
import { unwrapData } from '../../utils/apiData'
import { formatDateTime } from '../../utils/formatDate'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { APP_ROUTES } from '../../constants/routes'
import { MOCK_TICKETS } from '../../constants/mocks'

export default function TicketDetailPage() {
  const { ticketId } = useParams()
  const [ticket, setTicket] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTicketDetail = async () => {
      try {
        setIsLoading(true)
        // For now, we'll find the ticket from the list of 'my tickets'
        // In a real app, we'd have a getTicketById endpoint
        const response = await ticketService.getMyTickets()
        const fetchedTickets = unwrapData(response) ?? []
        const allTickets = [...MOCK_TICKETS, ...fetchedTickets]
        const found = allTickets.find(t => String(t.id) === String(ticketId))
        setTicket(found)
      } catch (error) {
        console.error('Failed to fetch ticket detail:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTicketDetail()
  }, [ticketId])

  if (isLoading) return <LoadingSpinner text="Đang tải thông tin vé..." />

  if (!ticket) {
    return (
      <div className="container page text-center py-20">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Không tìm thấy vé</h2>
        <Link to={APP_ROUTES.MY_TICKETS} className="text-blue-600 hover:underline">
          Quay lại danh sách vé của tôi
        </Link>
      </div>
    )
  }

  return (
    <section className="container page py-10">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col md:flex-row">
        {/* Left Side: QR & Seat Info */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-8 text-white flex flex-col items-center justify-center md:w-2/5">
          <div className="bg-white p-4 rounded-2xl mb-6 shadow-lg">
            <QRCode
              value={ticket.qr_token || `ticket-${ticket.id}`}
              size={180}
              level="H"
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            />
          </div>
          
          <div className="text-center space-y-4 w-full">
            <div className="border-t border-white/20 pt-4">
              <p className="text-blue-200 text-xs uppercase tracking-widest mb-1">Khán đài</p>
              <p className="text-3xl font-black">{ticket.stand_name || 'A'}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
              <div>
                <p className="text-blue-200 text-xs uppercase tracking-widest mb-1">Cửa</p>
                <p className="text-xl font-bold">{ticket.gate || ticket.stand_name || 'A'}</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs uppercase tracking-widest mb-1">Loại vé</p>
                <p className="text-xl font-bold">Phổ thông</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Match Info */}
        <div className="p-8 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wide">
              {ticket.status === 'paid' ? 'Đã thanh toán' : 'Đang xử lý'}
            </span>
            <p className="text-gray-400 text-xs font-mono">#{ticket.id}</p>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-black text-gray-900 leading-tight mb-2">
              {ticket.home_team} <span className="text-blue-600">vs</span> {ticket.away_team}
            </h1>
            <p className="text-gray-500 font-medium flex items-center gap-2">
              📅 {formatDateTime(ticket.match_date)}
            </p>
          </div>

          <div className="space-y-4 mb-auto">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🏟️</span>
              <div>
                <p className="font-bold text-gray-800">{ticket.stadium_name}</p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {ticket.stadium_address}, {ticket.stadium_city}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-dashed border-gray-200 pt-6 flex flex-col gap-3">
            <button 
              className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg active:scale-95"
              onClick={() => window.print()}
            >
              Tải vé PDF / In vé
            </button>
            <Link 
              to={APP_ROUTES.MY_TICKETS}
              className="text-center text-sm text-gray-500 hover:text-blue-600 py-2 transition-colors"
            >
              Quay lại danh sách vé của tôi
            </Link>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          nav, footer, .container.page > *:not(.max-w-2xl), button, a { display: none !important; }
          .max-w-2xl { margin: 0 auto !important; box-shadow: none !important; border: 1px solid #eee !important; width: 100% !important; max-width: 100% !important; }
          .page { padding: 0 !important; }
        }
      `}} />
    </section>
  )
}
