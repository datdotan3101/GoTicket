/* eslint-disable no-unused-vars */
import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import QRCodeLib from 'react-qr-code'
import { toPng } from 'html-to-image'
import { ticketService } from '../../services/ticketService'
import { unwrapData } from '../../utils/apiData'
import { formatDateTime } from '../../utils/formatters'
import { formatVND } from '../../utils/formatters'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { APP_ROUTES } from '../../constants/routes'
import { ArrowLeft, Download, MapPin, Building2, Gift, X } from 'lucide-react'
import { toast } from 'react-toastify'

const QRCodeComponent = typeof QRCodeLib === 'object' && QRCodeLib.default ? QRCodeLib.default : (QRCodeLib.QRCode || QRCodeLib);

export default function TicketDetailPage() {
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const ticketRef = useRef(null)
  
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false)
  const [giftEmail, setGiftEmail] = useState('')
  const [isGifting, setIsGifting] = useState(false)

  useEffect(() => {
    const fetchTicketDetail = async () => {
      try {
        setIsLoading(true)
        const response = await ticketService.getMyTickets()
        const fetchedTickets = unwrapData(response) ?? []
        const found = fetchedTickets.find(t => String(t.ticket_code) === String(ticketId))
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
        backgroundColor: 'var(--color-slate-100)',
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
      toast.error('Failed to save ticket image. Please try again.')
    }
  }

  const handleGiftTicket = async (e) => {
    e.preventDefault()
    if (!giftEmail || !/^\S+@\S+\.\S+$/.test(giftEmail)) {
      toast.error("Please enter a valid email address!")
      return
    }
    
    try {
      setIsGifting(true)
      await ticketService.giftTicket(ticket.ticket_code, giftEmail)
      toast.success(`Ticket has been successfully gifted to ${giftEmail}!`)
      setIsGiftModalOpen(false)
      setGiftEmail('')
      // Smoothly navigate back to My Tickets without hard reload
      navigate(APP_ROUTES.MY_TICKETS, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || "An error occurred while gifting the ticket.")
    } finally {
      setIsGifting(false)
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
        <div style={{ display: 'flex', gap: '12px' }}>
          {ticket.status === 'paid' && (
            <button 
              onClick={() => setIsGiftModalOpen(true)} 
              className="save-image-btn"
              disabled={ticket.is_gifted}
              style={{ 
                background: ticket.is_gifted ? 'var(--color-slate-300)' : '#ec4899', 
                color: 'white', 
                borderColor: ticket.is_gifted ? 'var(--color-slate-300)' : '#ec4899',
                cursor: ticket.is_gifted ? 'not-allowed' : 'pointer'
              }}
            >
              <Gift size={18} />
              <span>{ticket.is_gifted ? 'Already Gifted' : 'Gift Ticket'}</span>
            </button>
          )}
          <button 
            onClick={handleDownloadImage} 
            className="save-image-btn"
          >
            <Download size={18} />
            <span>Save as Image</span>
          </button>
        </div>
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

            <div className="ticket-footer-row" style={{ display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="footer-cell" style={{ flex: 1, padding: '15px 20px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                  <span className="cell-label">TOTAL QUANTITY</span>
                  <span className="cell-value">{ticket.total_quantity}</span>
                </div>
                <div className="footer-cell price-cell" style={{ flex: 1, padding: '15px 20px', textAlign: 'right' }}>
                  <span className="cell-label">TOTAL PAID</span>
                  <span className="cell-value price-text" style={{ fontSize: '1.4rem' }}>
                    {formatVND(ticket.total_price)}
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {(ticket.sections || []).map((sec, idx) => (
                  <div key={idx} className="footer-cell" style={{ 
                    flex: '1 0 50%', 
                    padding: '15px 20px', 
                    borderRight: idx % 2 === 0 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    borderBottom: idx < (ticket.sections.length - (ticket.sections.length % 2 === 0 ? 2 : 1)) ? '1px solid rgba(255,255,255,0.1)' : 'none'
                  }}>
                    <span className="cell-label">SECTION {sec.name}</span>
                    <span className="cell-value" style={{ fontSize: '1.1rem' }}>{sec.quantity} Ticket{sec.quantity > 1 ? 's' : ''}</span>
                  </div>
                ))}
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

      {/* Gift Ticket Modal */}
      {isGiftModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }} onClick={() => setIsGiftModalOpen(false)}>
          <div style={{
            background: 'var(--color-white)', padding: '32px', borderRadius: '24px', maxWidth: '420px', width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative',
            animation: 'modalSlideUp 0.3s ease-out'
          }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setIsGiftModalOpen(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--color-slate-100)', border: 'none', color: 'var(--color-slate-500)', width: '32px', height: '32px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>

            <div style={{
              width: '64px', height: '64px', background: '#fdf2f8', color: '#ec4899',
              borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '20px',
            }}>
              <Gift size={32} />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px', color: 'var(--color-slate-900)' }}>
              Gift this Ticket 🎁
            </h2>
            <p style={{ color: 'var(--color-slate-500)', lineHeight: 1.5, marginBottom: '24px', fontSize: '0.95rem' }}>
              We'll send the QR code and match details directly to your friend's email.
            </p>

            <form onSubmit={handleGiftTicket}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-slate-700)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Friend's Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="friend@example.com"
                  value={giftEmail}
                  onChange={(e) => setGiftEmail(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                    border: '1.5px solid var(--color-slate-300)', outline: 'none', fontSize: '1rem',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#ec4899'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--color-slate-300)'}
                />
              </div>

              <button
                type="submit"
                disabled={isGifting}
                style={{
                  width: '100%', padding: '14px', borderRadius: '12px',
                  background: isGifting ? '#f472b6' : '#ec4899', color: 'var(--color-white)',
                  fontWeight: 800, fontSize: '1rem', border: 'none',
                  cursor: isGifting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(236, 72, 153, 0.4)',
                  display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}
              >
                {isGifting ? 'Sending...' : 'Send Gift Ticket'}
              </button>
            </form>
          </div>
        </div>
      )}

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
