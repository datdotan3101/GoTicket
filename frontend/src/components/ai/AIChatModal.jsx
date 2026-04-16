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

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return

    const now = Date.now()
    if (now - lastSubmitTimeRef.current < 2000) {
       return
    }
    lastSubmitTimeRef.current = now

    pushMessage({ role: 'user', content: trimmed })
    setInput('')
    setIsLoading(true)

    try {
      const response = await aiService.chat(trimmed)
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
            <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?fit=crop&w=150&q=80" alt="Avatar" />
          </div>
          <h3 className="ai-modal-title">Trợ lý GoTicket</h3>
        </div>
        <button type="button" onClick={onClose} className="ai-modal-close" aria-label="Đóng chat">
          ✕
        </button>
      </div>

      <div className="ai-modal-body">
        {messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="ai-waving">👋</div>
            <div className="ai-chat-bubble-bot">
              Xin chào! Tôi có thể giúp gì cho bạn?
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
            <span></span>
            <span></span>
            <span></span>
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
            placeholder="Nhập câu hỏi của bạn..." 
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="ai-send-btn"
            aria-label="Gửi"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '-2px' }}>
              <line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
        
        <button 
          type="button" 
          onClick={clearMessages} 
          className="ai-clear-btn"
        >
          Xóa câu hỏi
        </button>
      </div>
    </div>
  )
}
