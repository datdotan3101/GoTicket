import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle, Loader2, ArrowLeft } from 'lucide-react'
import { useSocket } from '../../hooks/useSocket'
import { APP_ROUTES } from '../../constants/routes'
import { ticketService } from '../../services/ticketService'
import { unwrapData } from '../../utils/apiData'

export default function TicketRefundPage() {
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('refunding') // 'refunding' or 'cancelled'
  const [ticket, setTicket] = useState(null)
  
  const socketRef = useSocket({ enabled: true })

  // Listen to socket
  useEffect(() => {
    const socket = socketRef?.current
    if (!socket) return

    const onRefunded = (data) => {
      if (String(data.ticketCode) === String(ticketId)) {
        setStatus('cancelled')
      }
    }

    socket.on('ticket:refunded', onRefunded)
    return () => {
      socket.off('ticket:refunded', onRefunded)
    }
  }, [socketRef, ticketId])

  // Initial fetch to check if it's already cancelled
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await ticketService.getMyTickets()
        const fetchedTickets = unwrapData(response) ?? []
        const found = fetchedTickets.find(t => String(t.ticket_code) === String(ticketId))
        if (found) {
          setTicket(found)
          if (found.status === 'cancelled') {
            setStatus('cancelled')
          }
        }
      } catch (err) {
        console.error('Failed to fetch ticket', err)
      }
    }
    checkStatus()
  }, [ticketId])

  return (
    <section className="container page flex flex-col items-center justify-center min-h-[80vh] bg-slate-50 relative overflow-hidden rounded-3xl mt-8 mb-16 shadow-sm border border-slate-100">
      
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[100px] opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-100 rounded-full blur-[100px] opacity-60"></div>
      
      <div className="z-10 bg-white/70 backdrop-blur-xl p-12 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/50 text-center max-w-lg w-full transition-all duration-700">
        
        {status === 'refunding' ? (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-amber-100 rounded-full animate-ping opacity-75"></div>
              <div className="relative bg-amber-100 text-amber-600 p-6 rounded-full">
                <Loader2 size={48} className="animate-spin" />
              </div>
            </div>
            
            <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Processing Refund...</h2>
            <p className="text-slate-500 mb-6 leading-relaxed">
              We are securely processing the refund for ticket <strong className="text-slate-700 bg-slate-100 px-2 py-1 rounded">{ticketId}</strong>. 
              <br/>This usually takes just a few seconds.
            </p>
            
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full w-full rounded-full animate-pulse origin-left" style={{ animationDuration: '2s' }}></div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center animate-fade-in-up">
            <div className="mb-6 transform transition-transform hover:scale-110 duration-300">
              <div className="bg-green-100 text-green-600 p-6 rounded-full shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                <CheckCircle size={56} className="animate-bounce" style={{ animationIterationCount: 1 }} />
              </div>
            </div>
            
            <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Refund Successful!</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Ticket <strong className="text-slate-700">{ticketId}</strong> has been cancelled and the amount has been successfully refunded to your original payment method.
            </p>
            
            <div className="flex flex-col gap-3 w-full">
              <Link 
                to={APP_ROUTES.MY_TICKETS}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
                style={{ color: '#ffffff', textDecoration: 'none' }}
              >
                <ArrowLeft size={18} /> Back to My Tickets
              </Link>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </section>
  )
}
