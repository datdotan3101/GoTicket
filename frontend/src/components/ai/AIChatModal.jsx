import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChatStore } from '../../store/chatStore'
import { aiService } from '../../services/aiService'
import { unwrapData } from '../../utils/apiData'

const formatVND = (amount = 0) => {
  const formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(amount) || 0)
  return `${formatted} VND`
}

const formatDate = (dateStr) => {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleString('en-US', { 
    weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit', 
    hour: '2-digit', minute: '2-digit' 
  })
}

/* ─── MATCH CARD ─── */
function MatchCard({ match, onSelect }) {
  return (
    <div className="ai-match-card" onClick={() => onSelect(match)}>
      <div className="ai-match-card-teams">
        <span className="ai-match-team">{match.homeTeam}</span>
        <span className="ai-match-vs">VS</span>
        <span className="ai-match-team">{match.awayTeam}</span>
      </div>
      <div className="ai-match-card-info">
        <span>📅 {formatDate(match.matchDate)}</span>
        <span>🏟️ {match.stadiumName || 'N/A'}</span>
        {match.availableSeats > 0 && <span>🎫 {match.availableSeats} tickets left</span>}
      </div>
      <button type="button" className="ai-match-card-btn">Select this match</button>
    </div>
  )
}

/* ─── STAND LIST CARD ─── */
function StandListCard({ data, onSelectStand }) {
  if (!data?.stands) return null
  return (
    <div className="ai-stand-card">
      <div className="ai-stand-card-header">
        🏟️ {data.match.homeTeam} vs {data.match.awayTeam}
      </div>
      <div className="ai-stand-card-list">
        {data.stands.map(stand => (
          <div key={stand.id} className="ai-stand-item">
            <div className="ai-stand-item-info">
              <span className="ai-stand-name">{stand.name}</span>
              <span className="ai-stand-price">{formatVND(stand.price)}</span>
              <span className="ai-stand-seats">{stand.availableSeats > 0 ? `${stand.availableSeats} seats left` : 'Sold out'}</span>
            </div>
            {stand.availableSeats > 0 && (
              <button
                type="button"
                className="ai-stand-select-btn"
                onClick={() => onSelectStand(data.match, stand)}
              >
                Select
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── BOOKING SUCCESS CARD ─── */
function BookingCard({ data, onCheckout }) {
  if (!data) return null
  return (
    <div className="ai-booking-card">
      <div className="ai-booking-card-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        Booking successful!
      </div>
      <div className="ai-booking-card-body">
        <div className="ai-booking-row">
          <span>Match</span>
          <strong>{data.matchName}</strong>
        </div>
        <div className="ai-booking-row">
          <span>Date & Time</span>
          <strong>{formatDate(data.matchDate)}</strong>
        </div>
        <div className="ai-booking-row">
          <span>Stadium</span>
          <strong>{data.stadiumName || 'N/A'}</strong>
        </div>
        <div className="ai-booking-row">
          <span>Stand</span>
          <strong>{data.standName}</strong>
        </div>
        <div className="ai-booking-row">
          <span>Quantity</span>
          <strong>{data.quantity} tickets</strong>
        </div>
        <div className="ai-booking-row ai-booking-total">
          <span>Total</span>
          <strong>{formatVND(data.totalAmount)}</strong>
        </div>
      </div>
      <button
        type="button"
        className="ai-booking-checkout-btn"
        onClick={() => onCheckout(data)}
      >
        💳 Pay Now
      </button>
      <p className="ai-booking-note">Tickets are being held temporarily. Please pay to complete.</p>
    </div>
  )
}

export default function AIChatModal({ onClose }) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messages = useChatStore((state) => state.messages)
  const pushMessage = useChatStore((state) => state.pushMessage)
  const clearMessages = useChatStore((state) => state.clearMessages)
  const setPendingBooking = useChatStore((state) => state.setPendingBooking)

  const messagesEndRef = useRef(null)
  const navigate = useNavigate()

  const lastSubmitTimeRef = useRef(0)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const submitMessage = async (text) => {
    const trimmed = text.trim()
    if (!trimmed) return

    const now = Date.now()
    if (now - lastSubmitTimeRef.current < 2000) return
    lastSubmitTimeRef.current = now

    pushMessage({ role: 'user', content: trimmed })
    setInput('')
    setIsLoading(true)

    const newMessages = [...messages, { role: 'user', content: trimmed }]

    try {
      const response = await aiService.chat(newMessages)
      const data = unwrapData(response)

      if (data && data.reply) {
        pushMessage({
          role: 'assistant',
          content: data.reply,
          action: data.action || 'none',
          data: data.data || null
        })
      } else {
        pushMessage({ role: 'assistant', content: 'Sorry, I was unable to process your request at this time.' })
      }
    } catch {
      pushMessage({ role: 'assistant', content: 'An error occurred while connecting to the AI server. Please try again later.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    submitMessage(input)
  }

  /* ── Action handlers for interactive cards ── */
  const handleSelectMatch = (match) => {
    submitMessage(`I'd like to see stands and ticket prices for ${match.homeTeam} vs ${match.awayTeam}`)
  }

  const handleSelectStand = (match, stand) => {
    submitMessage(`Book me 1 ticket for stand ${stand.name} for the match ${match.homeTeam} vs ${match.awayTeam}`)
  }

  const handleCheckout = (bookingData) => {
    setPendingBooking(bookingData)
    onClose()
    navigate('/audience/checkout', {
      state: {
        matchId: bookingData.matchId,
        matchName: bookingData.matchName,
        selections: [{
          standId: bookingData.standId,
          standName: bookingData.standName,
          quantity: bookingData.quantity,
          price: bookingData.standPrice
        }],
        _fromChatbot: true,
        _ticketIds: bookingData.ticketIds,
        _clientSecret: bookingData.clientSecret
      }
    })
  }

  /* ── Render message content with interactive cards ── */
  const renderMessageContent = (msg) => {
    const { content, action, data } = msg

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {content && <span className="ai-msg-text">{content}</span>}

        {/* Match list cards */}
        {action === 'show_matches' && Array.isArray(data) && data.length > 0 && (
          <div className="ai-match-cards-list">
            {data.map(match => (
              <MatchCard key={match.id} match={match} onSelect={handleSelectMatch} />
            ))}
          </div>
        )}

        {/* Availability card */}
        {action === 'show_availability' && data && (
          <StandListCard data={data} onSelectStand={handleSelectStand} />
        )}

        {/* Booking created card */}
        {action === 'booking_created' && data && (
          <BookingCard data={data} onCheckout={handleCheckout} />
        )}

        {/* Legacy: checkout link fallback */}
        {!action && content && (() => {
          const checkoutRegex = /\/checkout\?match=\S+/g
          const matches = content.match(checkoutRegex)
          if (matches && matches.length > 0) {
            return (
              <button
                type="button"
                className="link-button"
                style={{ width: '100%', textAlign: 'center', background: '#059669' }}
                onClick={() => navigate(matches[0])}
              >
                Proceed to Book Tickets
              </button>
            )
          }
          return null
        })()}
      </div>
    )
  }

  return (
    <div className="ai-modal" role="dialog" aria-label="AI Assistant">
      <div className="ai-modal-header">
        <div className="ai-modal-header-left">
          <div className="ai-modal-avatar">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a2 2 0 0 1 2 2c-.11.66.16 1.34.66 1.84.5.5 1.18.77 1.84.66A2 2 0 0 1 18 8.5v5A2.5 2.5 0 0 1 15.5 16h-7A2.5 2.5 0 0 1 6 13.5v-5c0-1.27.91-2.3 2.1-2.46.66.11 1.34-.16 1.84-.66.5-.5.77-1.18.66-1.84A2 2 0 0 1 12 2Z"></path>
              <path d="M9 16v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2"></path>
              <circle cx="9" cy="9" r="1"></circle>
              <circle cx="15" cy="9" r="1"></circle>
            </svg>
          </div>
          <div className="ai-modal-title-wrapper">
            <h3 className="ai-modal-title">GoTicket Advisor</h3>
            <span className="ai-modal-status">Online Advisor</span>
          </div>
        </div>
        <div className="ai-modal-actions">
          <button type="button" onClick={clearMessages} className="ai-action-btn" title="Clear conversation">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
          </button>
          <button type="button" onClick={onClose} className="ai-action-btn" aria-label="Close chat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <div className="ai-modal-body">
        {messages.length === 0 ? (
          <div className="ai-welcome-container">
            <div className="ai-waving">🎫</div>
            <div className="ai-welcome-text">
              Hello! I'm your GoTicket advisor. I can help you find matches and book tickets right here in chat!
            </div>
            <div className="ai-quick-actions">
              <button type="button" onClick={() => submitMessage('Show me the upcoming match schedule')} className="ai-quick-btn">📅 Match Schedule</button>
              <button type="button" onClick={() => submitMessage('Book a ticket for me')} className="ai-quick-btn">🎫 Book a Ticket</button>
              <button type="button" onClick={() => submitMessage('Are there any hot upcoming matches?')} className="ai-quick-btn">🔥 Hot Matches</button>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
             <div 
               key={idx} 
               className={msg.role === 'user' ? 'ai-chat-bubble-user' : 'ai-chat-bubble-bot'}
             >
               {msg.role === 'assistant' ? renderMessageContent(msg) : <span>{msg.content}</span>}
             </div>
          ))
        )}
        
        {isLoading && (
          <div className="ai-typing">
            <span></span><span></span><span></span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="ai-modal-footer">
        <form onSubmit={handleSubmit} className="ai-input-form">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything... e.g. Book 2 tickets for the next match" 
            disabled={isLoading}
            autoFocus
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="ai-send-btn"
            aria-label="Send"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '-2px' }}>
              <line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
