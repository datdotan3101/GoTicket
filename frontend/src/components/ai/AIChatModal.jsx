import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChatStore } from '../../store/chatStore'
import { aiService } from '../../services/aiService'
import { unwrapData } from '../../utils/apiData'

export default function AIChatModal({ onClose }) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messages = useChatStore((state) => state.messages)
  const pushMessage = useChatStore((state) => state.pushMessage)
  const clearMessages = useChatStore((state) => state.clearMessages)
  
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

    const newMessages = [...messages, { role: 'user', content: trimmed }];
    
    try {
      const response = await aiService.chat(newMessages)
      const data = unwrapData(response)
      
      if (data && data.reply) {
         pushMessage({ role: 'assistant', content: data.reply })
      } else {
         pushMessage({ role: 'assistant', content: 'Xin lỗi, tôi không thể xử lý yêu cầu lúc này.' })
      }
    } catch (err) {
      pushMessage({ role: 'assistant', content: 'Có lỗi xảy ra khi kết nối máy chủ AI. Vui lòng thử lại sau.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    submitMessage(input)
  }

  const renderMessageContent = (content) => {
    const checkoutRegex = /\/checkout\?match=\S+/g
    const matches = content.match(checkoutRegex)

    if (matches && matches.length > 0) {
      const link = matches[0]
      const text = content.replace(link, '')
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span>{text.replace('Dẫn đến', '').trim()}</span>
          <button 
            type="button"
            className="link-button"
            style={{ width: '100%', textAlign: 'center', background: '#059669' }}
            onClick={() => navigate(link)}
          >
            Tiến hành Đặt vé
          </button>
        </div>
      )
    }

    return <span>{content}</span>
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
            <h3 className="ai-modal-title">GoTicket Assistant</h3>
            <span className="ai-modal-status">Trực tuyến</span>
          </div>
        </div>
        <div className="ai-modal-actions">
          <button type="button" onClick={clearMessages} className="ai-action-btn" title="Xóa trò chuyện">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
          </button>
          <button type="button" onClick={onClose} className="ai-action-btn" aria-label="Đóng chat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <div className="ai-modal-body">
        {messages.length === 0 ? (
          <div className="ai-welcome-container">
            <div className="ai-waving">👋</div>
            <div className="ai-welcome-text">
              Xin chào! Mình là trợ lý AI của GoTicket. Mình có thể giúp gì cho bạn?
            </div>
            <div className="ai-quick-actions">
              <button type="button" onClick={() => submitMessage('Tôi muốn xem lịch thi đấu')} className="ai-quick-btn">📅 Lịch thi đấu</button>
              <button type="button" onClick={() => submitMessage('Hướng dẫn tôi đặt vé')} className="ai-quick-btn">🎫 Đặt vé</button>
              <button type="button" onClick={() => submitMessage('Có trận đấu nào sắp tới không?')} className="ai-quick-btn">🔥 Trận hot sắp tới</button>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
             <div 
               key={idx} 
               className={msg.role === 'user' ? 'ai-chat-bubble-user' : 'ai-chat-bubble-bot'}
             >
               {msg.role === 'assistant' ? renderMessageContent(msg.content) : <span>{msg.content}</span>}
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
            placeholder="Nhập câu hỏi..." 
            disabled={isLoading}
            autoFocus
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="ai-send-btn"
            aria-label="Gửi"
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
