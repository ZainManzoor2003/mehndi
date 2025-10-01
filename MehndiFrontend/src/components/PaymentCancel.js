import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PaymentCancel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();


  return (
    <div className="payment-status-container">
      <div className="payment-status-card cancel">
        <div className="status-icon cancel-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" stroke="#e74c3c" fill="#f8d7da"/>
            <line x1="15" y1="9" x2="9" y2="15" stroke="#e74c3c" strokeWidth="3"/>
            <line x1="9" y1="9" x2="15" y2="15" stroke="#e74c3c" strokeWidth="3"/>
          </svg>
        </div>
        
        <h1 className="status-title cancel-title">Payment Cancelled</h1>
        <p className="status-message">
          Your payment was cancelled. No charges have been made to your account.
        </p>

        <div className="status-details">
          <div className="detail-item">
            <span className="detail-icon">!</span>
            <span className="detail-text">Transaction was not completed</span>
          </div>
          <div className="detail-item">
            <span className="detail-icon">!</span>
            <span className="detail-text">No charges applied</span>
          </div>
          <div className="detail-item">
            <span className="detail-icon">i</span>
            <span className="detail-text">You can try again anytime</span>
          </div>
        </div>

        <div className="status-actions">
          <Link to="/dashboard" className="btn-primary">
            Go to Dashboard
          </Link>
          <Link to="/dashboard/bookings" className="btn-secondary">
            View Bookings
          </Link>
        </div>

      </div>
    </div>
  );
};

export default PaymentCancel;

