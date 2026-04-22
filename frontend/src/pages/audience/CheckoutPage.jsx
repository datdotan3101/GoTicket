import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import toast from 'react-hot-toast'
import { paymentService } from '../../services/paymentService'
import { ticketService } from '../../services/ticketService'
import { formatVND } from '../../utils/formatCurrency'

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null

function CheckoutForm({ ticketIds, totalAmount }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isPaying, setIsPaying] = useState(false)

  const handlePay = async (event) => {
    event.preventDefault()

    if (!stripe || !elements) return

    setIsPaying(true)
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/audience/payment-success`,
      },
    })

    if (error) toast.error(error.message || 'Payment failed.')
    setIsPaying(false)
  }

  return (
    <form className="form" onSubmit={handlePay}>
      <PaymentElement />
      <button type="submit" disabled={!stripe || isPaying}>
        {isPaying ? 'Processing...' : `Pay ${formatVND(totalAmount)}`}
      </button>
      <p>Tickets: {ticketIds.join(', ')}</p>
    </form>
  )
}

export default function CheckoutPage() {
  const location = useLocation()
  const [clientSecret, setClientSecret] = useState('')
  const [ticketIds, setTicketIds] = useState([])
  const checkoutData = location.state
  const navigate = useNavigate()
  
  const totalAmount = useMemo(
    () => (Number(checkoutData?.price) || 0) * (Number(checkoutData?.quantity) || 0),
    [checkoutData],
  )

  const createPendingTickets = async () => {
    if (!checkoutData?.matchId || !checkoutData?.standId) {
      toast.error('Dữ liệu thanh toán không hợp lệ. Vui lòng chọn lại khán đài.')
      navigate('/')
      return
    }

    try {
      const bookResponse = await ticketService.book({
        matchId: checkoutData.matchId,
        standId: checkoutData.standId,
        quantity: checkoutData.quantity,
      })
      const booked = bookResponse.data?.data ?? []
      const ids = booked.map((ticket) => ticket.id)
      setTicketIds(ids)

      const intentResponse = await paymentService.createIntent({ ticketIds: ids })
      const payment = intentResponse.data?.data
      setClientSecret(payment?.clientSecret || '')
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Không thể tạo phiên thanh toán.')
    }
  }

  return (
    <section className="container page">
      <h1>Thanh toán</h1>
      <div className="bg-white p-6 rounded-2xl border border-gray-200 mb-6">
        <p className="text-gray-500 mb-2">Khán đài: <strong className="text-gray-900">{checkoutData?.standName}</strong></p>
        <p className="text-gray-500 mb-2">Số lượng: <strong className="text-gray-900">{checkoutData?.quantity} vé</strong></p>
        <p className="text-lg font-bold">Tổng cộng: <span className="text-blue-700">{formatVND(totalAmount)}</span></p>
      </div>

      {!clientSecret && (
        <button 
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95"
          type="button" 
          onClick={createPendingTickets}
        >
          Tiến hành thanh toán ngay
        </button>
      )}

      {clientSecret && stripePromise && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200">
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm ticketIds={ticketIds} totalAmount={totalAmount} />
          </Elements>
        </div>
      )}

      {clientSecret && !stripePromise && <p className="text-red-500">Thiếu VITE_STRIPE_PUBLIC_KEY trong .env</p>}
    </section>
  )
}
