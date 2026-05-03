import { useMemo, useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import toast from 'react-hot-toast'
import { CreditCard, ShieldCheck, Ticket, Info, Loader2, User, CheckCircle2, X, ArrowLeft } from 'lucide-react'
import { paymentService } from '../../services/paymentService'
import { ticketService } from '../../services/ticketService'
import { formatVND } from '../../utils/formatCurrency'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { APP_ROUTES } from '../../constants/routes'

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#1e293b',
      fontFamily: '"Inter", sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#94a3b8',
      },
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
};

function SuccessModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="success-modal">
        <div className="success-icon-wrapper">
          <CheckCircle2 size={80} className="success-icon" />
        </div>
        <h2 className="success-title">Payment Successful!</h2>
        <p className="success-message">
          Your tickets have been confirmed. You can view your ticket details in the "My Tickets" section.
        </p>
        <button 
          className="modal-button"
          onClick={onClose}
        >
          View My Tickets
        </button>
      </div>
    </div>
  )
}

function CheckoutForm({ totalAmount, onProcessing, onSuccess }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isPaying, setIsPaying] = useState(false)
  const [cardholderName, setCardholderName] = useState('')
  const [cardBrand, setCardBrand] = useState('visa')

  const handleBrandChange = (brand) => {
    setCardBrand(brand)
  }

  const handleConfirmPayment = async (event) => {
    event.preventDefault()
    if (!stripe || !elements) return
    if (!cardholderName.trim()) {
      toast.error('Please enter the cardholder name')
      return
    }

    setIsPaying(true)
    onProcessing(true)

    try {
      const result = await stripe.confirmCardPayment(window.clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
          billing_details: { name: cardholderName },
        },
      })

      if (result.error) {
        toast.error(result.error.message || 'Payment failed.')
        setIsPaying(false)
        onProcessing(false)
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          try {
            await paymentService.confirmLocalPayment(result.paymentIntent.id);
            onSuccess()
          } catch (confirmError) {
            toast.error('Transaction successful but status update failed. Please contact support.');
            setIsPaying(false);
            onProcessing(false);
          }
        }
      }
    } catch (err) {
      toast.error('An error occurred. Please try again.')
      setIsPaying(false)
      onProcessing(false)
    }
  }

  return (
    <form onSubmit={handleConfirmPayment} className="payment-form" autoComplete="off">
      <div className="brand-selector">
        <p className="selector-label">Select payment method:</p>
        <div className="brand-options">
          <button 
            type="button" 
            className={`brand-option ${cardBrand === 'visa' ? 'active' : ''}`}
            onClick={() => handleBrandChange('visa')}
          >
            <div className="brand-logo-wrapper">
              <img src="https://logos-world.net/wp-content/uploads/2020/04/Visa-Logo.png" alt="Visa" />
            </div>
            <span>Visa</span>
            {cardBrand === 'visa' && <CheckCircle2 size={16} className="check-icon" />}
          </button>
          
          <button 
            type="button" 
            className={`brand-option ${cardBrand === 'mastercard' ? 'active' : ''}`}
            onClick={() => handleBrandChange('mastercard')}
          >
            <div className="brand-logo-wrapper">
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="MasterCard" />
            </div>
            <span>MasterCard</span>
            {cardBrand === 'mastercard' && <CheckCircle2 size={16} className="check-icon" />}
          </button>
        </div>
      </div>

      <div className={`virtual-card ${cardBrand}`}>
        <div className="card-chip" />
        <div className="card-number-display">•••• •••• •••• ••••</div>
        <div className="card-bottom">
          <div className="card-holder">
            <div className="card-label">CARDHOLDER</div>
            <div className="card-value">{cardholderName || 'YOUR NAME HERE'}</div>
          </div>
          <div className="card-expiry">
            <div className="card-label">EXPIRY</div>
            <div className="card-value">MM/YY</div>
          </div>
        </div>
        <div className="card-brand-logo">
          {cardBrand === 'visa' ? (
            <img src="https://logos-world.net/wp-content/uploads/2020/04/Visa-Logo.png" alt="Visa" className="logo-img white-filter" />
          ) : (
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="MasterCard" className="logo-img" />
          )}
        </div>
      </div>

      <div className="payment-inputs">
        <div className="input-group">
          <label><User size={14} /> Cardholder Name</label>
          <input 
            type="text" 
            placeholder="NGUYEN VAN A" 
            className="custom-input"
            value={cardholderName}
            onChange={(e) => {
              const val = e.target.value.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/Đ/g, 'D');
              setCardholderName(val);
            }}
            required
          />
        </div>

        <div className="input-group">
          <label><CreditCard size={14} /> Card Number ({cardBrand.charAt(0).toUpperCase() + cardBrand.slice(1)})</label>
          <div className="stripe-input-wrapper">
            <CardNumberElement 
              options={CARD_ELEMENT_OPTIONS} 
              onChange={(e) => {
                if (e.brand && e.brand !== 'unknown') {
                  setCardBrand(e.brand === 'mastercard' ? 'mastercard' : 'visa');
                }
              }}
            />
          </div>
        </div>

        <div className="input-row">
          <div className="input-group">
            <label>Expiry Date</label>
            <div className="stripe-input-wrapper">
              <CardExpiryElement options={CARD_ELEMENT_OPTIONS} />
            </div>
          </div>
          <div className="input-group">
            <label>CVC / CVV</label>
            <div className="stripe-input-wrapper">
              <CardCvcElement options={CARD_ELEMENT_OPTIONS} />
            </div>
          </div>
        </div>
      </div>
      
      <button 
        type="submit" 
        className="pay-button"
        disabled={!stripe || isPaying}
      >
        {isPaying ? (
          <><Loader2 className="animate-spin" size={20} /> Processing...</>
        ) : (
          'Pay'
        )}
      </button>

      <div className="payment-security-note">
        <ShieldCheck size={16} />
        Transactions are secured by the international Stripe system.
      </div>
    </form>
  )
}

export default function CheckoutPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const checkoutData = location.state

  const [clientSecret, setClientSecret] = useState('')
  const [ticketIds, setTicketIds] = useState([])
  const [isInitializing, setIsInitializing] = useState(true)
  const [isGlobalProcessing, setIsGlobalProcessing] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const totalAmount = useMemo(
    () => (Number(checkoutData?.price) || 0) * (Number(checkoutData?.quantity) || 0),
    [checkoutData],
  )

  useEffect(() => {
    window.clientSecret = clientSecret
    window.totalAmount = totalAmount
  }, [clientSecret, totalAmount])

  const createPendingTickets = useCallback(async () => {
    if (!checkoutData?.matchId || !checkoutData?.standId) {
      toast.error('Invalid payment data.')
      navigate('/')
      return
    }

    try {
      setIsInitializing(true)
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
      toast.error(error.response?.data?.message ?? 'Failed to initialize payment session.')
      navigate(-1)
    } finally {
      setIsInitializing(false)
    }
  }, [checkoutData, navigate])

  useEffect(() => {
    createPendingTickets()
  }, [createPendingTickets])

  const handlePaymentSuccess = () => {
    setIsGlobalProcessing(false)
    setShowSuccessModal(true)
  }

  const handleCloseSuccess = () => {
    setShowSuccessModal(false)
    navigate('/audience/my-tickets')
  }

  if (isInitializing) {
    return (
      <div className="checkout-loading-screen">
        <LoadingSpinner text="Connecting to secure payment gateway..." />
      </div>
    )
  }

  return (
    <section className="checkout-page">
      <div className="checkout-header">
        <div className="container">
          <div className="checkout-header-content">
            <button onClick={() => navigate(-1)} className="checkout-back-btn" title="Back to Seat Selection">
              <ArrowLeft size={24} />
            </button>
            <h1 className="checkout-title">Payment</h1>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="checkout-layout">
          <div className="checkout-summary">
            <div className="summary-card">
              <div className="card-header">
                <Ticket className="header-icon" />
                <h3>Order Details</h3>
              </div>
              
              <div className="summary-details">
                <div className="detail-item">
                  <span className="label">Match</span>
                  <span className="value">{checkoutData?.matchName || 'Soccer Match'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Section</span>
                  <span className="value highlight">{checkoutData?.standName}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Quantity</span>
                  <span className="value">{checkoutData?.quantity} tickets</span>
                </div>
              </div>

              <div className="summary-total">
                <div className="total-row">
                  <span>Total</span>
                  <span className="total-value">{formatVND(totalAmount)}</span>
                </div>
              </div>

              <div className="summary-info">
                <Info size={16} />
                <span>You will receive your digital tickets immediately after a successful transaction.</span>
              </div>
            </div>
          </div>

          <div className="checkout-payment">
            <div className="payment-card">
              <div className="card-header">
                <CreditCard className="header-icon" />
                <h3>Card Information</h3>
              </div>

              {clientSecret && stripePromise ? (
                <div className="stripe-container">
                  <Elements stripe={stripePromise}>
                    <CheckoutForm 
                      totalAmount={totalAmount} 
                      onProcessing={setIsGlobalProcessing} 
                      onSuccess={handlePaymentSuccess}
                    />
                  </Elements>
                </div>
              ) : (
                <div className="payment-error">
                  Initializing secure payment gateway...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isGlobalProcessing && (
        <div className="payment-overlay">
          <LoadingSpinner text="Processing secure transaction..." />
        </div>
      )}

      <SuccessModal 
        isOpen={showSuccessModal} 
        onClose={handleCloseSuccess} 
      />
    </section>
  )
}
