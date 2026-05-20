import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import toast from 'react-hot-toast'
import { CreditCard, ShieldCheck, Ticket, Info, Loader2, User, CheckCircle2, X, ArrowLeft, Clock } from 'lucide-react'
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

function SessionExpiredModal({ isOpen, onBack }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="success-modal">
        <div className="success-icon-wrapper" style={{ background: '#fef2f2' }}>
          <X size={80} style={{ color: '#ef4444' }} />
        </div>
        <h2 className="success-title" style={{ color: '#1e293b' }}>Session Expired</h2>
        <p className="success-message">
          Your 10-minute hold on these seats has expired. The seats have been released.
        </p>
        <button 
          className="modal-button"
          onClick={onBack}
          style={{ background: '#ef4444' }}
        >
          Return to Seat Selection
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

export default function CheckoutPage({ checkoutDataProp, onBackProp }) {
  const location = useLocation()
  const navigate = useNavigate()
  const checkoutData = checkoutDataProp || location.state

  const [clientSecret, setClientSecret] = useState('')
  const [ticketIds, setTicketIds] = useState([])
  const [isInitializing, setIsInitializing] = useState(true)
  const [isGlobalProcessing, setIsGlobalProcessing] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Countdown timer states & refs
  const [timeLeft, setTimeLeft] = useState(null)
  const [isExpired, setIsExpired] = useState(false)
  const isPaidRef = useRef(false)
  const ticketIdsRef = useRef([])

  useEffect(() => {
    ticketIdsRef.current = ticketIds
  }, [ticketIds])

  // Automatically release tickets if user closes the tab or navigates away
  useEffect(() => {
    return () => {
      if (!isPaidRef.current && ticketIdsRef.current.length > 0) {
        ticketService.cancel(ticketIdsRef.current).catch(err => {
          console.error("Auto-cancel failed on unmount:", err)
        })
      }
    }
  }, [])

  // Timer logic
  useEffect(() => {
    if (timeLeft === null) return

    if (timeLeft <= 0) {
      setIsExpired(true)
      if (ticketIds.length > 0) {
        ticketService.cancel(ticketIds).catch(err => console.error(err))
      }
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, ticketIds])

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleBack = () => {
    if (onBackProp) onBackProp()
    else navigate(-1)
  }

  const totalAmount = useMemo(
    () => {
      if (checkoutData?.selections) {
        return checkoutData.selections.reduce((acc, s) => acc + s.price * s.quantity, 0)
      }
      return (Number(checkoutData?.price) || 0) * (Number(checkoutData?.quantity) || 0)
    },
    [checkoutData],
  )

  useEffect(() => {
    window.clientSecret = clientSecret
    window.totalAmount = totalAmount
  }, [clientSecret, totalAmount])

  const createPendingTickets = useCallback(async () => {
    // If booking was already created by the AI chatbot, skip booking + intent creation
    if (checkoutData?._fromChatbot && checkoutData?._ticketIds && checkoutData?._clientSecret) {
      setTicketIds(checkoutData._ticketIds)
      setClientSecret(checkoutData._clientSecret)
      setIsInitializing(false)
      setTimeLeft(600)
      return
    }

    if (!checkoutData?.matchId || (!checkoutData?.standId && !checkoutData?.selections)) {
      toast.error('Invalid payment data.')
      if (!onBackProp) navigate('/')
      return
    }

    try {
      setIsInitializing(true)
      const bookResponse = await ticketService.book({
        matchId: checkoutData.matchId,
        selections: checkoutData.selections,
        standId: checkoutData.standId,
        quantity: checkoutData.quantity,
      })
      const booked = bookResponse.data?.data ?? []
      const ids = booked.map((ticket) => ticket.id)
      setTicketIds(ids)

      // Initialize countdown from DB timestamp
      if (booked.length > 0 && booked[0].created_at) {
        const createdAt = new Date(booked[0].created_at).getTime()
        const expiresAt = createdAt + 10 * 60 * 1000 // 10 minutes
        const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
        setTimeLeft(remaining)
        if (remaining <= 0) {
          setIsExpired(true)
        }
      } else {
        setTimeLeft(600)
      }

      const intentResponse = await paymentService.createIntent({ ticketIds: ids })
      const payment = intentResponse.data?.data
      setClientSecret(payment?.clientSecret || '')
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Failed to initialize payment session.')
      handleBack()
    } finally {
      setIsInitializing(false)
    }
  }, [checkoutData, navigate, onBackProp])

  useEffect(() => {
    createPendingTickets()
  }, [createPendingTickets])

  const handlePaymentSuccess = () => {
    isPaidRef.current = true
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


      <div className="container">
        {/* Countdown Banner */}
        <div className="countdown-banner">
          <Clock size={18} />
          <span>
            Your seats are reserved. Please complete payment in <strong>{formatTime(timeLeft)}</strong>. After this, your booking will be cancelled.
          </span>
        </div>

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
                {checkoutData?.selections ? checkoutData.selections.map((sel, idx) => (
                  <div key={idx} style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '12px', marginTop: '12px' }}>
                    <div className="detail-item">
                      <span className="label">Section</span>
                      <span className="value highlight">{sel.standName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Quantity</span>
                      <span className="value">{sel.quantity} tickets</span>
                    </div>
                    <div className="detail-item" style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      <span className="label">Subtotal</span>
                      <span>{formatVND(sel.price * sel.quantity)}</span>
                    </div>
                  </div>
                )) : (
                  <>
                    <div className="detail-item">
                      <span className="label">Section</span>
                      <span className="value highlight">{checkoutData?.standName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Quantity</span>
                      <span className="value">{checkoutData?.quantity} tickets</span>
                    </div>
                  </>
                )}
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

      <SessionExpiredModal 
        isOpen={isExpired} 
        onBack={handleBack} 
      />
    </section>
  )
}
