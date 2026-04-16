import { useState, useEffect } from 'react'
import AIChatModal from './AIChatModal'
import { useChatStore } from '../../store/chatStore'

const BUBBLE_WRAPPER_STYLE = {
  position: 'fixed',
  bottom: '30px',
  right: '30px',
  zIndex: 999999,
  display: 'flex',
  alignItems: 'center',
  gap: '14px'
}

const GREETING_STYLE = {
  background: '#ffffff',
  padding: '12px 18px',
  borderRadius: '24px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  fontSize: '0.85rem',
  color: '#111827',
  fontWeight: '600',
  cursor: 'pointer',
  border: '1px solid #f3f4f6',
  whiteSpace: 'nowrap'
}

const BUTTON_STYLE_OPEN = {
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  backgroundColor: '#374151',
  color: 'white',
  border: 'none',
  boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'transform 0.2s',
}

const BUTTON_STYLE_CLOSED = {
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  backgroundColor: '#0d6efd',
  color: 'white',
  border: 'none',
  boxShadow: '0 8px 24px rgba(13, 110, 253, 0.35)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'transform 0.2s',
}

export default function AIChatBubble() {
  const [isOpen, setIsOpen] = useState(false)
  const [showGreeting, setShowGreeting] = useState(false)
  const messages = useChatStore((state) => state.messages)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (messages.length === 0 && !isOpen) {
        setShowGreeting(true)
      }
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [messages.length, isOpen])

  const toggleModal = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setShowGreeting(false)
    }
  }

  return (
    <>
      {isOpen && <AIChatModal onClose={() => setIsOpen(false)} />}
      
      <div style={BUBBLE_WRAPPER_STYLE}>
        {!isOpen && showGreeting && (
          <div style={GREETING_STYLE} onClick={toggleModal}>
            Xin chào! 👋 Cần hỗ trợ tìm vé không?
          </div>
        )}

        <button
          type="button"
          onClick={toggleModal}
          style={isOpen ? BUTTON_STYLE_OPEN : BUTTON_STYLE_CLOSED}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title={isOpen ? "Đóng AI trợ lý" : "Mở AI trợ lý"}
        >
          {isOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          )}
        </button>
      </div>
    </>
  )
}
