import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import QRCodeLib from 'react-qr-code'
import { toPng } from 'html-to-image'
import { ticketService } from '../../services/ticketService'
import { unwrapData } from '../../utils/apiData'
import { formatDateTime } from '../../utils/formatDate'
import { formatVND } from '../../utils/formatCurrency'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { APP_ROUTES } from '../../constants/routes'
import { MOCK_TICKETS } from '../../constants/mocks'
import { ArrowLeft, Download, MapPin, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

const QRCodeComponent = typeof QRCodeLib === 'object' && QRCodeLib.default ? QRCodeLib.default : (QRCodeLib.QRCode || QRCodeLib);

export default function TicketDetailPage() {
  const { ticketId } = useParams()
  const [ticket, setTicket] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const ticketRef = useRef(null)

  useEffect(() => {
    const fetchTicketDetail = async () => {
      try {
        setIsLoading(true)
        const response = await ticketService.getMyTickets()
        const fetchedTickets = unwrapData(response) ?? []
        const allTickets = [...MOCK_TICKETS, ...fetchedTickets]
        const found = allTickets.find(t => String(t.ticket_code) === String(ticketId))
        setTicket(found)
      } catch (error) {
        console.error('Failed to fetch ticket detail:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTicketDetail()
  }, [ticketId])

  const handleDownloadImage = async () => {
    if (!ticketRef.current) return

    try {
      const el = ticketRef.current
      const dataUrl = await toPng(el, {
        cacheBust: true,
        backgroundColor: '#f1f5f9',
        pixelRatio: 2,
        width: el.offsetWidth,
        height: el.offsetHeight,
        style: {
          margin: '0',
          transform: 'none',
        }
      })
      
      const link = document.createElement('a')
      link.download = `GoTicket_${ticket.ticket_code}.png`
      link.href = dataUrl
      link.click()
      toast.success('Ticket saved successfully!')
    } catch (err) {
      console.error('Download error:', err)
      toast.error('Failed to save ticket image. Please try again.')
    }
  }

  if (isLoading) return <LoadingSpinner text="Loading ticket details..." />

  if (!ticket) {
    return (
      <div className="container page text-center py-20">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Ticket not found</h2>
        <Link to={APP_ROUTES.MY_TICKETS} className="text-blue-600 hover:underline">
          Back to My Tickets
        </Link>
      </div>
    )
  }

  const matchTime = formatDateTime(ticket.match_date, 'HH:mm')
  const matchDate = formatDateTime(ticket.match_date, 'dd/MM/yyyy')

  return (
    <section className="container page ticket-detail-page py-10">
      
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-8 max-w-5xl mx-auto print:hidden">
        <Link to={APP_ROUTES.MY_TICKETS} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors">
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>
        <button 
          onClick={handleDownloadImage} 
          className="save-image-btn"
        >
          <Download size={18} />
          <span>Save as Image</span>
        </button>
      </div>

      {/* Realistic Ticket Design */}
      <div className="realistic-ticket-wrapper max-w-5xl mx-auto" ref={ticketRef}>
        <div className="realistic-ticket">
          
          {/* Left Side: Main Ticket Info */}
          <div className="ticket-left">
            <div className="ticket-header-top">
              <span className="event-name">GOTICKET</span>
              <span className="event-subtitle">PREMIUM SPORTS TICKETING SYSTEM</span>
            </div>

            <div className="ticket-body-main">
              <div className="category-badge">MEN'S FOOTBALL</div>
              
              <div className="match-teams">
                <h1 className="team-name">{ticket.home_team}</h1>
                <span className="vs">VS</span>
                <h1 className="team-name">{ticket.away_team}</h1>
              </div>

              <div className="match-time-info">
                {matchTime} on {matchDate}
              </div>

              <div className="stadium-info">
                <div className="info-item">
                  <Building2 size={14} /> {ticket.stadium_name} Stadium
                </div>
                <div className="info-item">
                  <MapPin size={14} /> {ticket.stadium_address}, {ticket.stadium_city}
                </div>
              </div>
            </div>

            <div className="ticket-footer-row">
              <div className="footer-cell">
                <span className="cell-label">STAND</span>
                <span className="cell-value">{ticket.stand_name}</span>
              </div>
              <div className="footer-cell">
                <span className="cell-label">QUANTITY</span>
                <span className="cell-value">{ticket.quantity}</span>
              </div>
              <div className="footer-cell flex-2">
                <span className="cell-label">SEATS</span>
                <span className="cell-value seats-text">{ticket.seat_labels}</span>
              </div>
              <div className="footer-cell price-cell">
                <span className="cell-label">PRICE</span>
                <span className="cell-value price-text">
                  {ticket.price ? formatVND(ticket.price * ticket.quantity) : '500,000 VND'}
                </span>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="ticket-separator">
            <div className="hole top"></div>
            <div className="dashed-line"></div>
            <div className="hole bottom"></div>
          </div>

          {/* Right Side: Control Stub & QR */}
          <div className="ticket-right">
            
            <div className="qr-container">
              <div className="qr-box">
                <QRCodeComponent
                  value={ticket.qr_token || `ticket-group-${ticket.ticket_code}`}
                  size={120}
                  level="H"
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
              <p className="qr-help-text">Scan QR at the gate</p>
            </div>

              <div className="control-details">
                <div className="detail-row">
                  <span className="d-label">TICKET CODE:</span>
                  <span className="d-value code-highlight">{ticket.ticket_code}</span>
                </div>
                <div className="detail-row">
                  <span className="d-label">DATE:</span>
                  <span className="d-value">{matchDate}</span>
                </div>
                <div className="detail-row">
                  <span className="d-label">STATUS:</span>
                  <span className={`d-value status-badge ${ticket.status}`}>
                    {ticket.status === 'paid' ? 'UNUSED' : 
                     ticket.status === 'checked_in' ? 'USED' : 
                     ticket.status === 'pending' ? 'UNUSED' : 'CANCELLED'}
                  </span>
                </div>
                <div className="ticket-disclaimer">
                  * Ticket value expires after the match ends.
                </div>
              </div>
          </div>
          
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .realistic-ticket-wrapper, .realistic-ticket-wrapper * { visibility: visible; }
          .realistic-ticket-wrapper { position: absolute; left: 0; top: 0; width: 100%; transform: scale(0.9); transform-origin: top left; }
        }
      `}} />
    </section>
  )
}
