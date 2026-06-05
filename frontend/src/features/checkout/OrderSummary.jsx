import React from 'react';
import { Ticket, Info } from 'lucide-react';
import { formatVND } from '../../utils/formatters';

export default function OrderSummary({ checkoutData, totalAmount }) {
  return (
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
          <div key={idx} style={{ borderTop: '1px dashed var(--color-slate-200)', paddingTop: '12px', marginTop: '12px' }}>
            <div className="detail-item">
              <span className="label">Section</span>
              <span className="value highlight">{sel.standName}</span>
            </div>
            <div className="detail-item">
              <span className="label">Quantity</span>
              <span className="value">{sel.quantity} tickets</span>
            </div>
            <div className="detail-item" style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)' }}>
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
  );
}
