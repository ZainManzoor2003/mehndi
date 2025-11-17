import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import apiService, { bookingsAPI } from "../services/api";
import "./PaymentSuccess.css";

const { applicationsAPI } = apiService;

const PaymentSuccess = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    const bookingId = params.get("bookingId");
    const applicationId = params.get("applicationId");
    const paidAmountParam = params.get("paidAmount");
    const remainingParam = params.get("remaining");
    const isPaidParam = params.get("isPaid");
    const paymentType = params.get("paymentType");
    const amount = params.get("amount");
    const artistId = params.get("artistId");

    console.log("Frontend - URL params:", {
      checkout,
      bookingId,
      applicationId,
      paidAmountParam,
      remainingParam,
      isPaidParam,
      paymentType,
      amount,
      artistId,
    });

    if (checkout === "success") {
      const finalize = async () => {
        try {
          // Handle remaining payment flow
          if (paymentType === "remaining" && bookingId) {
            console.log("Processing remaining payment for booking:", bookingId);
            const isPaidValue = isPaidParam || "full";
            const remainingAmount = Number(amount || 0) || 0;

            await bookingsAPI.updateBookingPaymentStatus({
              isPaid: isPaidValue,
              remainingPayment: remainingAmount,
              bookingId: bookingId,
              artistId: artistId,
            });

            console.log("Booking payment status updated successfully");
          }
          // Handle regular application payment flow
          else if (bookingId && applicationId) {
            const paidAmountNum = Number(paidAmountParam || 0) || 0;
            const remainingNum = Number(remainingParam || 0) || 0;
            const isPaidValue = isPaidParam || "none";
            await applicationsAPI.updateApplicationStatus(
              applicationId,
              bookingId,
              "accepted",
              {
                paymentPaid: paidAmountNum,
                remainingPayment: remainingNum,
                isPaid: isPaidValue,
              }
            );
          }
        } catch (e) {
          console.error("Error processing payment:", e);
        } finally {
          // Clean URL
          const url = new URL(window.location.href);
          url.search = "";
          window.history.replaceState({}, document.title, url.toString());
        }
      };
      finalize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="payment-success-container">
      <div className="payment-success-card">
        <div className="payment-success-icon-wrapper">
          <div className="payment-success-dot payment-success-dot-1"></div>
          <div className="payment-success-dot payment-success-dot-2"></div>
          <div className="payment-success-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
        </div>

        <h1 className="payment-success-title">Payment Complete</h1>
        <p className="payment-success-description">
          Your payment has been received successfully. A confirmation email has
          been sent, and your booking is now secured. We'll remind you closer to
          your event date.
        </p>

        <div className="payment-success-details">
          <div className="payment-success-detail-item">
            <div className="payment-success-detail-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <span className="payment-success-detail-text">
              Payment processed securely
            </span>
          </div>
          <div className="payment-success-detail-item">
            <div className="payment-success-detail-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <span className="payment-success-detail-text">
              Confirmation email sent
            </span>
          </div>
          <div className="payment-success-detail-item">
            <div className="payment-success-detail-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <span className="payment-success-detail-text">
              Booking confirmed
            </span>
          </div>
        </div>

        <div className="payment-success-actions">
          <Link
            to="/dashboard"
            className="payment-success-btn payment-success-btn-primary"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/dashboard/bookings"
            className="payment-success-btn payment-success-btn-secondary"
          >
            View My Bookings
          </Link>
        </div>

        <div className="payment-success-footer">
          <p className="payment-success-footer-text">
            Thank you for booking with Mehndi Me
            <svg
              className="payment-success-leaf-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66 2.24-6.14C10.38 14.7 15.65 12 22 12V8z" />
            </svg>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
