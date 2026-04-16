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
  const selectedSeats = useMemo(() => checkoutData?.seats ?? [], [checkoutData?.seats])
  const totalAmount = useMemo(
    () => selectedSeats.reduce((sum, seat) => sum + Number(seat.price || 0), 0),
    [selectedSeats],
  )

  const createPendingTickets = async () => {
    if (!checkoutData?.matchId || !checkoutData?.seatIds?.length) {
      toast.error('Missing checkout data. Please select seats again.')
      navigate('/')
      return
    }

    try {
      const bookResponse = await ticketService.book({
        matchId: checkoutData.matchId,
        seatIds: checkoutData.seatIds,
      })
      const booked = bookResponse.data?.data ?? []
      const ids = booked.map((ticket) => ticket.id)
      setTicketIds(ids)

      const intentResponse = await paymentService.createIntent({ ticketIds: ids })
      const payment = intentResponse.data?.data
      setClientSecret(payment?.clientSecret || '')
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Cannot create checkout session.')
    }
  }

  return (
    <section className="container page">
      <h1>Checkout</h1>
      <p>Selected seats: {selectedSeats.map((seat) => seat.seat_label).join(', ') || 'none'}</p>
      <p>Total: {formatVND(totalAmount)}</p>

      {!clientSecret && (
        <button type="button" onClick={createPendingTickets}>
          Create payment session
        </button>
      )}

      {clientSecret && stripePromise && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm ticketIds={ticketIds} totalAmount={totalAmount} />
        </Elements>
      )}

      {clientSecret && !stripePromise && <p>Missing VITE_STRIPE_PUBLIC_KEY in .env</p>}
    </section>
  )
}
