import React, { useState } from "react";
import { Link } from "react-router-dom";

const BrowseApplyModal = ({
  open,
  onClose,
  onConfirm,
  busy = false,
  title = "Apply to Request",
  booking,
}) => {
  const [proposedBudget, setProposedBudget] = useState("");
  const [duration, setDuration] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [success, setSuccess] = useState(false);
  const [shakeTerms, setShakeTerms] = useState(false);

  const resetForm = () => {
    setProposedBudget("");
    setDuration("");
    setMessage("");
    setAgreed(false);
    setErrors({});
    setShakeTerms(false);
    setSuccess(false);
  };

  if (!open) return null;

  const handleBudgetChange = (e) => {
    const value = e.target.value;
    // Allow empty, or numeric with optional decimal point
    if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setProposedBudget(value);
    }
  };

  const handleDurationChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setDuration(value);
    }
  };

  const validate = () => {
    const e = {};
    if (!proposedBudget || Number(proposedBudget) <= 0)
      e.proposedBudget = "Please enter a valid proposed budget";
    if (!duration || Number(duration) <= 0)
      e.estimatedDuration = "Please enter a valid estimated duration";
    if (!message || message.trim().length < 50)
      e.proposalMessage = "Proposal message must be at least 50 characters";
    if (!agreed) {
      // Just shake the terms section, do NOT close the modal
      setShakeTerms(true);
      setTimeout(() => setShakeTerms(false), 400);
    }

    setErrors(e);
    // Form is valid only if no field errors AND terms are agreed
    return Object.keys(e).length === 0 && agreed;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await onConfirm({
        proposedBudget,
        duration,
        message,
        agreed,
        setSuccess,
      });
      // setSuccess(true);
    } catch (_) {}
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="application-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "900px",
          maxHeight: "90vh",
          width: "95%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <style>
          {`
            @keyframes shake-horizontal {
              0%, 100% { transform: translateX(0); }
              20%, 60% { transform: translateX(-4px); }
              40%, 80% { transform: translateX(4px); }
            }
          `}
        </style>

        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body" style={{ padding: 0, overflowY: "auto" }}>
          {success ? (
            <div style={{ padding: 24 }}>
              <div
                style={{
                  background: "#FFF7E6",
                  border: "1px solid #f5e0b8",
                  borderRadius: 16,
                  padding: "28px 22px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 44, color: "#16a34a" }}>✔</div>
                <h2 style={{ margin: "8px 0 6px", color: "#4A2C1D" }}>
                  Your Offer Has Been Sent! 🎉
                </h2>
                <p style={{ margin: 0, color: "#6b5544" }}>
                  Thank you for applying. The client will review your offer and
                  get back to you through MehndiMe.
                </p>
                <p style={{ marginTop: 10, color: "#6b5544" }}>
                  You can track your offer’s status in your Artist Dashboard.
                </p>
                <Link
                  to="/artist-dashboard/applications"
                  style={{
                    display: "inline-block",
                    marginTop: 14,
                    background: "#5C3D2E",
                    color: "#fff",
                    padding: "12px 18px",
                    borderRadius: 12,
                    textDecoration: "none",
                    fontWeight: 700,
                  }}
                >
                  Go to Artist Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <>
              {booking && (
                <div
                  className="booking-card-modal"
                  style={{
                    background:
                      "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                    border: "1px solid #dee2e6",
                    borderRadius: "12px",
                    margin: "20px",
                    padding: "20px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <div
                    className="booking-header"
                    style={{
                      marginBottom: "0",
                      textAlign: "left",
                      flexDirection: "column",
                    }}
                  >
                    <h4
                      style={{
                        margin: "0 0 16px 0",
                        fontSize: "18px",
                        fontWeight: "600",
                        color: "#2c3e50",
                        textAlign: "left",
                      }}
                    >
                      {(Array.isArray(booking.eventType)
                        ? booking.eventType[0]
                        : booking.eventType || "Mehndi") +
                        (booking.city || booking.location
                          ? ` at ${booking.city || booking.location}`
                          : "")}
                    </h4>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "14px",
                          color: "#6c757d",
                          justifyContent: "flex-start",
                        }}
                      >
                        <span style={{ fontSize: "16px" }}>💰</span>
                        <span>
                          Client Budget: £{booking.minimumBudget}–£
                          {booking.maximumBudget}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "14px",
                          color: "#6c757d",
                          justifyContent: "flex-start",
                        }}
                      >
                        <span style={{ fontSize: "16px" }}>📍</span>
                        <span>
                          Location:{" "}
                          {booking.location || booking.city || "Not specified"}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "14px",
                          color: "#6c757d",
                          justifyContent: "flex-start",
                        }}
                      >
                        <span style={{ fontSize: "16px" }}>📅</span>
                        <span>
                          Event Date:{" "}
                          {booking.eventDate
                            ? new Date(booking.eventDate).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "TBD"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div
                className="application-form"
                style={{ padding: "0 20px 20px 20px" }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  <div
                    className="form-card"
                    style={{
                      background: "#f8f9fa",
                      border: "1px solid #e9ecef",
                      borderRadius: "12px",
                      padding: "20px",
                    }}
                  >
                    <h4
                      className="section-title"
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        marginBottom: "16px",
                        color: "#2c3e50",
                      }}
                    >
                      Budget & Timeline
                    </h4>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "20px",
                      }}
                    >
                      <div className="form-group">
                        <label
                          className="form-label"
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            marginBottom: "8px",
                            color: "#495057",
                          }}
                        >
                          Your Proposed Budget (£) *
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          className={`form-input ${
                            errors.proposedBudget ? "error" : ""
                          }`}
                          placeholder="450"
                          value={proposedBudget}
                          onChange={handleBudgetChange}
                          disabled={busy}
                          min="0"
                          step="0.01"
                          style={{
                            width: "100%",
                            padding: "12px",
                            border: "1px solid #ced4da",
                            borderRadius: "8px",
                            fontSize: "14px",
                            outline: "none",
                            transition: "border-color 0.2s ease",
                          }}
                        />
                        {errors.proposedBudget && (
                          <span
                            className="error-text"
                            style={{
                              color: "#dc3545",
                              fontSize: "12px",
                              marginTop: "4px",
                              display: "block",
                            }}
                          >
                            {errors.proposedBudget}
                          </span>
                        )}
                      </div>
                      <div className="form-group">
                        <label
                          className="form-label"
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            marginBottom: "8px",
                            color: "#495057",
                          }}
                        >
                          Estimated Duration (hours) *
                        </label>
                        <div
                          className="duration-input-group"
                          style={{ display: "flex", gap: "8px" }}
                        >
                          <input
                            type="number"
                            inputMode="decimal"
                            className={`form-input ${
                              errors.estimatedDuration ? "error" : ""
                            }`}
                            placeholder="4"
                            value={duration}
                            onChange={handleDurationChange}
                            disabled={busy}
                            min="0"
                            step="0.5"
                            style={{
                              flex: "2",
                              padding: "12px",
                              border: "1px solid #ced4da",
                              borderRadius: "8px",
                              fontSize: "14px",
                              outline: "none",
                              transition: "border-color 0.2s ease",
                              minWidth: "120px",
                            }}
                          />
                        </div>
                        {errors.estimatedDuration && (
                          <span
                            className="error-text"
                            style={{
                              color: "#dc3545",
                              fontSize: "12px",
                              marginTop: "4px",
                              display: "block",
                            }}
                          >
                            {errors.estimatedDuration}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className="form-card"
                    style={{
                      background: "#f8f9fa",
                      border: "1px solid #e9ecef",
                      borderRadius: "12px",
                      padding: "20px",
                    }}
                  >
                    <h4
                      className="section-title"
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        marginBottom: "16px",
                        color: "#2c3e50",
                      }}
                    >
                      Your Proposal
                    </h4>
                    <div className="form-group">
                      <label
                        className="form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "500",
                          marginBottom: "8px",
                          color: "#495057",
                        }}
                      >
                        Proposal Message *
                      </label>
                      <textarea
                        className={`form-textarea ${
                          errors.proposalMessage ? "error" : ""
                        }`}
                        placeholder="Write a message explaining why you're the best fit for this booking. Include your approach and what makes you unique..."
                        rows="6"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={busy}
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "1px solid #ced4da",
                          borderRadius: "8px",
                          fontSize: "14px",
                          outline: "none",
                          transition: "border-color 0.2s ease",
                          resize: "vertical",
                          fontFamily: "inherit",
                          lineHeight: "1.4",
                        }}
                      />
                      <small
                        style={{
                          color: errors.proposalMessage
                            ? "#dc3545"
                            : message.length >= 50
                            ? "#28a745"
                            : "#6c757d",
                          fontSize: "12px",
                          marginTop: "4px",
                          display: "block",
                        }}
                      >
                        {errors.proposalMessage
                          ? errors.proposalMessage
                          : `${message.length}/50 characters minimum`}
                      </small>
                    </div>
                  </div>

                  <div
                    className="form-card"
                    style={{
                      background: "#f8f9fa",
                      border: "1px solid #e9ecef",
                      borderRadius: "12px",
                      padding: "20px",
                    }}
                  >
                    <h4
                      className="section-title"
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        marginBottom: "16px",
                        color: "#2c3e50",
                      }}
                    >
                      Terms & Conditions
                    </h4>
                    <div
                      className="checkbox-group"
                      style={{
                        animation: shakeTerms
                          ? "shake-horizontal 0.35s ease-in-out"
                          : "none",
                      }}
                    >
                      <label
                        className="checkbox-label"
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "8px",
                          cursor: "pointer",
                          fontSize: "14px",
                          lineHeight: "1.4",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={agreed}
                          onChange={(e) => setAgreed(e.target.checked)}
                          disabled={busy}
                          style={{ marginTop: "2px" }}
                        />
                        <span style={{ color: "#495057" }}>
                          I agree to MehndiMe&apos;s{" "}
                          <Link
                            to="/terms-conditions"
                            // target="_blank"
                            // rel="noopener noreferrer"
                            style={{
                              color: "#EA7C25",
                              textDecoration: "underline",
                              fontWeight: 500,
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Terms &amp; Conditions
                          </Link>{" "}
                          and{" "}
                          <Link
                            to="/privacy-policy"
                            // target="_blank"
                            // rel="noopener noreferrer"
                            style={{
                              color: "#EA7C25",
                              textDecoration: "underline",
                              fontWeight: 500,
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Privacy Policy
                          </Link>
                          , and understand that all payments and communication
                          must remain on the MehndiMe platform to ensure
                          protection for both artists and clients.
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div
          className="modal-footer"
          style={{
            borderTop: "1px solid #e9ecef",
            padding: "20px",
            backgroundColor: "#f8f9fa",
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          {!success ? (
            <>
              <button
                className="cancel-btn"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                disabled={busy}
                style={{
                  padding: "12px 24px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#6c757d",
                  backgroundColor: "white",
                  border: "1px solid #dee2e6",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                Cancel
              </button>
              <button
                className="submit-btn"
                onClick={handleSubmit}
                disabled={busy}
                style={{
                  padding: "12px 24px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "white",
                  backgroundColor: busy ? "#6c757d" : "#EA7C25",
                  border: "none",
                  borderRadius: "8px",
                  cursor: busy ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!busy) {
                    e.target.style.backgroundColor = "#804018";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!busy) {
                    e.target.style.backgroundColor = "#EA7C25";
                  }
                }}
              >
                {busy ? "Submitting Application..." : "Submit Application"}
              </button>
            </>
          ) : (
            <button
              className="cancel-btn"
              onClick={() => {
                resetForm();
                onClose();
              }}
              style={{
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#6c757d",
                backgroundColor: "white",
                border: "1px solid #dee2e6",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseApplyModal;
