/* eslint-disable react-hooks/exhaustive-deps */
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Clock, CreditCard } from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { ticketService } from '../../services/ticketService';
import { notifyError } from '../../utils/toastUtils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

import CheckoutForm from './CheckoutForm';
import OrderSummary from './OrderSummary';
import { SuccessModal, SessionExpiredModal } from './CheckoutModals';
import { useCountdown } from '../../hooks/useCountdown';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

export default function CheckoutPage({ checkoutDataProp, onBackProp }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const checkoutData = useMemo(() => {
    if (checkoutDataProp || location.state) return checkoutDataProp || location.state;
    const sessionStr = sessionStorage.getItem('checkoutSession');
    if (sessionStr) return JSON.parse(sessionStr).checkoutData;
    return null;
  }, [checkoutDataProp, location.state]);

  const [clientSecret, setClientSecret] = useState('');
  const [ticketIds, setTicketIds] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isGlobalProcessing, setIsGlobalProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [targetDate, setTargetDate] = useState(null);
  const countdown = useCountdown(targetDate);
  const [isExpired, setIsExpired] = useState(false);
  const isPaidRef = useRef(false);
  const ticketIdsRef = useRef([]);
  const bookingInitiated = useRef(false);
  const isReloading = useRef(false);

  useEffect(() => { ticketIdsRef.current = ticketIds; }, [ticketIds]);

  useEffect(() => {
    const handleBeforeUnload = () => { isReloading.current = true; };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (!isPaidRef.current && ticketIdsRef.current.length > 0 && !isReloading.current) {
        ticketService.cancel(ticketIdsRef.current).catch(err => console.error("Auto-cancel failed on unmount:", err));
      }
    };
  }, []);

  const clearSession = useCallback(() => { sessionStorage.removeItem('checkoutSession'); }, []);

  useEffect(() => {
    if (targetDate && countdown.isExpired && !isExpired) {
      setIsExpired(true);
      clearSession();
      if (ticketIds.length > 0) ticketService.cancel(ticketIds).catch(console.error);
    }
  }, [countdown.isExpired, targetDate, isExpired, clearSession, ticketIds]);

  const formatTime = (cd) => {
    if (!targetDate) return '--:--';
    return `${cd.minutes.toString().padStart(2, '0')}:${cd.seconds.toString().padStart(2, '0')}`;
  };

  const handleBack = () => {
    clearSession();
    if (onBackProp) onBackProp();
    else navigate(-1);
  };

  const totalAmount = useMemo(() => {
    if (checkoutData?.selections) return checkoutData.selections.reduce((acc, s) => acc + s.price * s.quantity, 0);
    return (Number(checkoutData?.price) || 0) * (Number(checkoutData?.quantity) || 0);
  }, [checkoutData]);

  useEffect(() => { window.totalAmount = totalAmount; }, [totalAmount]);

  const createPendingTickets = useCallback(async () => {
    if (checkoutData?._fromChatbot && checkoutData?._ticketIds && checkoutData?._clientSecret) {
      setTicketIds(checkoutData._ticketIds);
      setClientSecret(checkoutData._clientSecret);
      setIsInitializing(false);
      setTargetDate(Date.now() + 600 * 1000);
      return;
    }

    if (bookingInitiated.current) return;
    bookingInitiated.current = true;

    const sessionStr = sessionStorage.getItem('checkoutSession');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        const now = Date.now();
        const createdAtTime = new Date(session.createdAt).getTime();
        const remaining = Math.max(0, Math.floor((createdAtTime + 10 * 60 * 1000 - now) / 1000));
        const isSameCheckout = JSON.stringify(session.checkoutData) === JSON.stringify(checkoutData);

        if (remaining > 0 && isSameCheckout && session.ticketIds?.length && session.clientSecret) {
          setTicketIds(session.ticketIds);
          setClientSecret(session.clientSecret);
          setTargetDate(createdAtTime + 10 * 60 * 1000);
          setIsInitializing(false);
          return;
        } else {
          sessionStorage.removeItem('checkoutSession');
        }
      } catch (e) {
        sessionStorage.removeItem('checkoutSession');
      }
    }

    if (!checkoutData?.matchId || (!checkoutData?.standId && !checkoutData?.selections)) {
      notifyError('Invalid payment data.');
      if (!onBackProp) navigate('/');
      return;
    }

    try {
      setIsInitializing(true);
      const bookResponse = await ticketService.book({
        matchId: checkoutData.matchId,
        selections: checkoutData.selections,
        standId: checkoutData.standId,
        quantity: checkoutData.quantity,
      });
      const booked = bookResponse.data?.data ?? [];
      const ids = booked.map(ticket => ticket.id);
      setTicketIds(ids);

      let createdAt = new Date().toISOString();
      if (booked.length > 0 && booked[0].created_at) {
        createdAt = booked[0].created_at;
      }
      
      const createdAtTime = new Date(createdAt).getTime();
      const expirationTime = createdAtTime + 10 * 60 * 1000;
      setTargetDate(expirationTime);
      if (Date.now() >= expirationTime) setIsExpired(true);

      const intentResponse = await paymentService.createIntent({ ticketIds: ids });
      const newClientSecret = intentResponse.data?.data?.clientSecret || '';
      setClientSecret(newClientSecret);

      sessionStorage.setItem('checkoutSession', JSON.stringify({
        checkoutData,
        ticketIds: ids,
        clientSecret: newClientSecret,
        createdAt: createdAt
      }));
    } catch (error) {
      notifyError(error.response?.data?.message ?? 'Failed to initialize payment session.');
      handleBack();
    } finally {
      setIsInitializing(false);
    }
  }, [checkoutData, navigate, onBackProp, handleBack]);

  useEffect(() => { createPendingTickets(); }, [createPendingTickets]);

  if (isInitializing) {
    return <div className="checkout-loading-screen"><LoadingSpinner text="Connecting to secure payment gateway..." /></div>;
  }

  return (
    <section className="checkout-page">
      <div className="container">
        <div className="countdown-banner">
          <Clock size={18} />
          <span>
            Your seats are reserved. Please complete payment in <strong>{formatTime(countdown)}</strong>. After this, your booking will be cancelled.
          </span>
        </div>

        <div className="checkout-layout">
          <div className="checkout-summary">
            <OrderSummary checkoutData={checkoutData} totalAmount={totalAmount} />
          </div>

          <div className="checkout-payment">
            <div className="payment-card">
              <div className="card-header">
                <CreditCard className="header-icon" />
                <h3>Card Information</h3>
              </div>

              {clientSecret && stripePromise ? (
                <div className="stripe-container">
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm 
                      clientSecret={clientSecret}
                      onProcessing={setIsGlobalProcessing} 
                      onSuccess={() => { isPaidRef.current = true; setIsGlobalProcessing(false); clearSession(); setShowSuccessModal(true); }}
                    />
                  </Elements>
                </div>
              ) : (
                <div className="payment-error">Initializing secure payment gateway...</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isGlobalProcessing && <div className="payment-overlay"><LoadingSpinner text="Processing secure transaction..." /></div>}
      <SuccessModal isOpen={showSuccessModal} onClose={() => { setShowSuccessModal(false); navigate('/audience/my-tickets'); }} />
      <SessionExpiredModal isOpen={isExpired} onBack={handleBack} />
    </section>
  );
}
