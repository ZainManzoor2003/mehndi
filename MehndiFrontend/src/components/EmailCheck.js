import React, { useEffect, useMemo, useState } from "react";
import { FaEnvelope } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";

const useQuery = () => {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

const EmailCheck = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const email = query.get("email") || "";
  const phone = query.get("phone") || "";

  const [secondsLeft, setSecondsLeft] = useState(30);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    setError("");
    setSecondsLeft(30);
  }, [email]);

  useEffect(() => {
    if (verified) return; // stop timer on success screen
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, verified]);

  const handleResend = async () => {
    if (!email) return;
    setError("");
    setSending(true);
    try {
      await authAPI.resendVerificationEmail(email);
      setSecondsLeft(30);
    } catch (e) {
      // If already verified, switch to verified screen
      if ((e.message || "").toLowerCase().includes("already verified")) {
        setVerified(true);
      } else {
        setError(e.message || "Failed to resend verification email.");
      }
    } finally {
      setSending(false);
    }
  };

  const handleContinueAfterVerification = async () => {
    if (!email) return;
    setError("");
    setSending(true);
    try {
      // Use resend endpoint to probe status; backend returns 400 if already verified
      await authAPI.resendVerificationEmail(email);
      // Not verified yet
      setError(
        "Your email isn't verified yet. Please check your inbox and try again."
      );
    } catch (e) {
      if ((e.message || "").toLowerCase().includes("already verified")) {
        setVerified(true);
      } else {
        setError(e.message || "Unable to check verification status.");
      }
    } finally {
      setSending(false);
    }
  };

  const handleContinueToPhone = () => {
    const qs = new URLSearchParams({ email, phone }).toString();
    navigate(`/verify-phone?${qs}`);
  };

  return (
    <>
      {/* <Header /> */}
      <div
        className="auth-container"
        style={{ margin: "0 auto", height: "100vh" }}
      >
        <div
          className="auth-card"
          style={{ maxWidth: 520, animation: "fadeIn 420ms ease-out both" }}
        >
          {!verified ? (
            <div style={{ textAlign: "center", padding: "1.5rem 1rem" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  margin: "0 auto 1rem",
                  borderRadius: 12,
                  background: "#fff7ed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "inset 0 0 0 2px #fed7aa",
                  animation: "scaleIn 380ms ease-out both",
                }}
              >
                <FaEnvelope size={28} color="#d97706" />
              </div>
              <h2 style={{ color: "#7c2d12", margin: "0 0 0.5rem" }}>
                Check Your Email
              </h2>
              <p style={{ color: "#7c2d12", margin: 0, lineHeight: 1.6 }}>
                We've sent a verification link to{" "}
                <strong>{email || "your@email.com"}</strong>. Please click it to
                confirm your account.
              </p>

              {error && (
                <p style={{ color: "#b91c1c", marginTop: "1rem" }}>{error}</p>
              )}

              <div style={{ marginTop: "1.25rem" }}>
                <button
                  disabled={secondsLeft > 0 || sending}
                  onClick={handleResend}
                  aria-disabled={secondsLeft > 0 || sending}
                  style={{
                    width: "100%",
                    padding: "0.85rem 1rem",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    background: secondsLeft > 0 ? "#e5e7eb" : "#ffffff",
                    color: "#374151",
                    cursor: secondsLeft > 0 ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    filter: secondsLeft > 0 ? "grayscale(100%)" : "none",
                    opacity: secondsLeft > 0 ? 0.8 : 1,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                    animation: "fadeInUp 420ms ease-out 120ms both",
                  }}
                >
                  {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : "Resend"}
                </button>

                <button
                  onClick={handleContinueAfterVerification}
                  disabled={sending}
                  style={{
                    width: "100%",
                    padding: "0.85rem 1rem",
                    marginTop: "0.75rem",
                    borderRadius: 12,
                    border: "2px solid #ea580c",
                    background: "transparent",
                    color: "#9a3412",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "background 180ms ease",
                    animation: "fadeInUp 420ms ease-out 220ms both",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "rgba(234, 88, 12, 0.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  Continue after Verification
                </button>

                <div style={{ marginTop: "0.75rem" }}>
                  <Link
                    to="/signup"
                    style={{ color: "#7c2d12", textDecoration: "underline" }}
                  >
                    Use a different email
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "1.5rem 1rem",
                animation: "fadeIn 420ms ease-out both",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  margin: "0 auto 1rem",
                  borderRadius: 32,
                  background: "#ecfdf5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "inset 0 0 0 2px #a7f3d0",
                  animation: "scaleIn 380ms ease-out both",
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 style={{ color: "#6b5544", margin: "0 0 0.5rem" }}>
                Email Verified!
              </h2>
              <p style={{ color: "#6b5544", margin: 0, lineHeight: 1.6 }}>
                Your email is confirmed. You can now continue to phone
                verification.
              </p>
              <div style={{ marginTop: "1rem" }}>
                <button
                  onClick={handleContinueToPhone}
                  style={{
                    width: "100%",
                    padding: "0.9rem 1rem",
                    borderRadius: 12,
                    border: "none",
                    background: "#ea580c",
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                    animation: "fadeInUp 420ms ease-out 140ms both",
                  }}
                >
                  Continue to Phone Verification
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          0% { opacity: 0; transform: scale(0.7); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default EmailCheck;
