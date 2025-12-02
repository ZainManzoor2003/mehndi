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
          backgroundColor: "#FFF9F3",
          borderRadius: "16px",
          maxWidth: "480px",
          width: "100%",
          boxShadow: "0 18px 45px rgba(0,0,0,0.18)",
          overflow: "hidden",
          border: "1px solid rgba(192,106,43,0.15)",
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "999px",
                background:
                  "linear-gradient(135deg, rgba(192,106,43,0.12), rgba(224,139,66,0.2))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#C06A2B",
              }}
            >
              <FaExclamationTriangle />
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: "1.05rem",
                fontWeight: 600,
                color: "#5A3313",
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
        <div style={{ padding: "0 22px 20px" }}>
          {message && (
            <p
              style={{
                margin: 0,
                fontSize: "0.95rem",
                color: "#7B4A22",
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
                padding: "0.55rem 1.3rem",
                fontSize: "0.9rem",
                fontWeight: 500,
                borderRadius: "999px",
                border: "1px solid rgba(181,138,99,0.4)",
                backgroundColor: "rgba(255,255,255,0.9)",
                color: "#6B4A2E",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#F5E6D4";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.9)";
              }}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="home__cta-button"
              style={{
                padding: "0.55rem 1.5rem",
                fontSize: "0.9rem",
                borderRadius: "999px",
                boxShadow: "0 4px 12px rgba(192,106,43,0.35)",
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
