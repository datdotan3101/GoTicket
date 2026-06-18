import React, { useState, useRef } from 'react';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { CreditCard, ShieldCheck, Loader2, User, CheckCircle2 } from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { notifySuccess, notifyError } from '../../utils/toastUtils';
import visaLogo from '../../assets/visa-logo.png';
import mastercardLogo from '../../assets/Mastercard-logo.svg.png';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#1e293b',
      fontFamily: '"Inter", sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': { color: '#94a3b8' },
    },
    invalid: { color: '#ef4444', iconColor: '#ef4444' },
  },
};

export default function CheckoutForm({ clientSecret, onProcessing, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isPaying, setIsPaying] = useState(false);
  const isPayingRef = useRef(false);
  const [cardBrand, setCardBrand] = useState('visa');

  const handleConfirmPayment = async (event) => {
    event.preventDefault();
    if (isPayingRef.current) return;
    if (!stripe || !elements) return;

    isPayingRef.current = true;
    setIsPaying(true);
    onProcessing(true);

    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
        },
      });

      if (result.error) {
        notifyError(result.error.message || 'Payment failed.');
      } else if (result.paymentIntent.status === 'succeeded') {
        try {
          await paymentService.confirmLocalPayment(result.paymentIntent.id);
          onSuccess();
        } catch (confirmError) {
          notifyError('Transaction successful but status update failed. Please contact support.');
        }
      }
    } catch (err) {
      notifyError('An error occurred. Please try again.');
    } finally {
      if (!isPayingRef.current || document.hidden) return; // if successful, we just leave it loading or close.
      // Wait, we need to reset if error
      isPayingRef.current = false;
      setIsPaying(false);
      onProcessing(false);
    }
  };

  return (
    <form onSubmit={handleConfirmPayment} className="payment-form" autoComplete="off">
      <div className="brand-selector">
        <p className="selector-label">Select payment method:</p>
        <div className="brand-options">
          <button type="button" className={`brand-option ${cardBrand === 'visa' ? 'active' : ''}`} onClick={() => setCardBrand('visa')}>
            <div className="brand-logo-wrapper"><img src={visaLogo} alt="Visa" /></div>
            <span>Visa</span>{cardBrand === 'visa' && <CheckCircle2 size={16} className="check-icon" />}
          </button>
          
          <button type="button" className={`brand-option ${cardBrand === 'mastercard' ? 'active' : ''}`} onClick={() => setCardBrand('mastercard')}>
            <div className="brand-logo-wrapper"><img src={mastercardLogo} alt="MasterCard" /></div>
            <span>MasterCard</span>{cardBrand === 'mastercard' && <CheckCircle2 size={16} className="check-icon" />}
          </button>
        </div>
      </div>

      <div className={`virtual-card ${cardBrand}`}>
        <div className="card-chip" />
        <div className="card-number-display">•••• •••• •••• ••••</div>
        <div className="card-bottom">
          <div className="card-expiry">
            <div className="card-label">EXPIRY</div>
            <div className="card-value">MM/YY</div>
          </div>
        </div>
        <div className="card-brand-logo">
          {cardBrand === 'visa' ? (
            <img src={visaLogo} alt="Visa" className="logo-img white-filter" />
          ) : (
            <img src={mastercardLogo} alt="MasterCard" className="logo-img" />
          )}
        </div>
      </div>

      <div className="payment-inputs">
        <div className="input-group">
          <label><CreditCard size={14} /> Card Number ({cardBrand.charAt(0).toUpperCase() + cardBrand.slice(1)})</label>
          <div className="stripe-input-wrapper">
            <CardNumberElement options={{ ...CARD_ELEMENT_OPTIONS, placeholder: '•••• •••• •••• ••••' }} onChange={(e) => { if (e.brand && e.brand !== 'unknown') setCardBrand(e.brand === 'mastercard' ? 'mastercard' : 'visa'); }} />
          </div>
        </div>

        <div className="input-row">
          <div className="input-group"><label>Expiry Date</label><div className="stripe-input-wrapper"><CardExpiryElement options={{ ...CARD_ELEMENT_OPTIONS, placeholder: 'MM/YY' }} /></div></div>
          <div className="input-group"><label>CVC / CVV</label><div className="stripe-input-wrapper"><CardCvcElement options={{ ...CARD_ELEMENT_OPTIONS, placeholder: 'CVC' }} /></div></div>
        </div>
      </div>
      
      <button type="submit" className="pay-button" disabled={!stripe || isPaying}>
        {isPaying ? <><Loader2 className="animate-spin" size={20} /> Processing...</> : 'Pay'}
      </button>

      <div className="payment-security-note"><ShieldCheck size={16} />Transactions are secured by the international Stripe system.</div>
    </form>
  );
}
