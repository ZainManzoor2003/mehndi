import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";

/**
 * Simple themed confirmation modal used instead of window.confirm.
 *
 * Props:
 * - isOpen: boolean
 * - title: string
 * - message: string | ReactNode
 * - confirmLabel?: string
 * - cancelLabel?: string
 * - onConfirm: () => void | Promise<void>
 * - onCancel: () => void
 */
const ConfirmActionModal = ({
  isOpen,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel && onCancel();
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1.5rem",
      }}
    >
      <div
        className="confirmation-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          maxWidth: "520px",
          width: "100%",
          boxShadow: "0 18px 45px rgba(0,0,0,0.18)",
          overflow: "hidden",
          border: "1px solid rgba(248,113,113,0.35)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 22px 14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "999px",
                background:
                  "linear-gradient(135deg, rgba(248,113,113,0.12), rgba(248,113,113,0.25))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#DC2626",
              }}
            >
              <FaExclamationTriangle />
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: "1.15rem",
                fontWeight: 600,
                color: "#111827",
              }}
            >
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.4rem",
              lineHeight: 1,
              color: "#B58A63",
              padding: 0,
            }}
            aria-label="Close confirmation"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "0 22px 22px" }}>
          {message && (
            <p
              style={{
                margin: 0,
                fontSize: "0.95rem",
                color: "#4B5563",
                lineHeight: 1.6,
              }}
            >
              {message}
            </p>
          )}

          {/* Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "20px",
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: "0.6rem 1.5rem",
                fontSize: "0.9rem",
                fontWeight: 500,
                borderRadius: "999px",
                border: "1px solid #E5E7EB",
                backgroundColor: "#F3F4F6",
                color: "#374151",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#E5E7EB";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#F3F4F6";
              }}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              style={{
                padding: "0.6rem 1.6rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                borderRadius: "999px",
                border: "none",
                backgroundColor: "#DC2626",
                color: "#ffffff",
                boxShadow: "0 6px 18px rgba(220,38,38,0.35)",
                cursor: "pointer",
                transition:
                  "background-color 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#B91C1C";
                e.currentTarget.style.boxShadow =
                  "0 8px 20px rgba(185,28,28,0.5)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#DC2626";
                e.currentTarget.style.boxShadow =
                  "0 6px 18px rgba(220,38,38,0.35)";
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmActionModal;
