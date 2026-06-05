import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

export function SuccessModal({ isOpen, onClose }) {
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
        <button className="modal-button" onClick={onClose}>
          View My Tickets
        </button>
      </div>
    </div>
  );
}

export function SessionExpiredModal({ isOpen, onBack }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="success-modal">
        <div className="success-icon-wrapper" style={{ background: '#fef2f2' }}>
          <X size={80} style={{ color: 'var(--color-danger)' }} />
        </div>
        <h2 className="success-title" style={{ color: 'var(--color-slate-800)' }}>Session Expired</h2>
        <p className="success-message">
          Your 10-minute hold on these seats has expired. The seats have been released.
        </p>
        <button className="modal-button" onClick={onBack} style={{ background: 'var(--color-danger)' }}>
          Return to Seat Selection
        </button>
      </div>
    </div>
  );
}
