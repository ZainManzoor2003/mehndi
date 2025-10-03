import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService, { bookingsAPI } from '../services/api'

const { applicationsAPI } = apiService;

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    const bookingId = params.get('bookingId');
    const applicationId = params.get('applicationId');
    const paidAmountParam = params.get('paidAmount');
    const remainingParam = params.get('remaining');
    const isPaidParam = params.get('isPaid');
    const paymentType = params.get('paymentType');
    const amount = params.get('amount');
    const artistId = params.get('artistId');

    console.log('Frontend - URL params:', {
      checkout,
      bookingId,
      applicationId,
      paidAmountParam,
      remainingParam,
      isPaidParam,
      paymentType,
      amount,
      artistId
    });

    if (checkout === 'success') {
      const finalize = async () => {
        try {
          // Handle remaining payment flow
          if (paymentType === 'remaining' && bookingId) {
            console.log('Processing remaining payment for booking:', bookingId);
            const isPaidValue = isPaidParam || 'full';
            const remainingAmount = Number(amount || 0) || 0;
            
            await bookingsAPI.updateBookingPaymentStatus({
              isPaid: isPaidValue,
              remainingPayment: remainingAmount,
              bookingId: bookingId,
              artistId:artistId
            });
            
            console.log('Booking payment status updated successfully');
          }
          // Handle regular application payment flow
          else if (bookingId && applicationId) {
            const paidAmountNum = Number(paidAmountParam || 0) || 0;
            const remainingNum = Number(remainingParam || 0) || 0;
            const isPaidValue = isPaidParam || 'none';
            await applicationsAPI.updateApplicationStatus(
              applicationId,
              bookingId,
              'accepted',
              { paymentPaid: paidAmountNum, remainingPayment: remainingNum, isPaid: isPaidValue }
            );
          }
        } catch (e) {
          console.error('Error processing payment:', e);
        } finally {
          // Clean URL
          const url = new URL(window.location.href);
          url.search = '';
          window.history.replaceState({}, document.title, url.toString());
        }
      };
      finalize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="payment-status-container">
      <div className="payment-status-card success">
        <div className="status-icon success-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" stroke="#27ae60" fill="#d4edda" />
            <path d="M9 12l2 2 4-4" stroke="#27ae60" strokeWidth="3" />
          </svg>
        </div>

        <h1 className="status-title success-title">Payment Successful!</h1>
        <p className="status-message">
          Your payment has been processed successfully. Thank you for your payment.
        </p>

        <div className="status-details">
          <div className="detail-item">
            <span className="detail-icon">✓</span>
            <span className="detail-text">Transaction completed</span>
          </div>
          <div className="detail-item">
            <span className="detail-icon">✓</span>
            <span className="detail-text">Confirmation email sent</span>
          </div>
          <div className="detail-item">
            <span className="detail-icon">✓</span>
            <span className="detail-text">Booking confirmed</span>
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

export default PaymentSuccess;

