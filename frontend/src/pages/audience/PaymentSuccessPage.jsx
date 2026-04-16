import { Link } from 'react-router-dom'

export default function PaymentSuccessPage() {
  return (
    <section className="container page">
      <h1>Payment success</h1>
      <p>Your payment is being confirmed by webhook. Tickets will move to paid status shortly.</p>
      <Link className="link-button" to="/audience/my-tickets">Go to my tickets</Link>
    </section>
  )
}
