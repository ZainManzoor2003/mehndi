import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { authAPI } from "../services/api";
import Header from "./Header";

const EmailVerification = () => {
  const { token } = useParams();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState(
    "Verifying your email, please wait..."
  );

  useEffect(() => {
    const verifyUserEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("No verification token provided.");
        return;
      }

      try {
        const response = await authAPI.verifyEmail(token);
        setStatus("success");
        setMessage(
          response.message || "Email verified successfully! You can now log in."
        );
      } catch (error) {
        setStatus("error");
        setMessage(
          error.message ||
            "Failed to verify email. The link may be expired or invalid."
        );
      }
    };

    verifyUserEmail();
  }, [token]);

  return (
    <>
      <Header />
      <div className="auth-container" style={{ marginTop: "6.5rem" }}>
        <div className="auth-card">
          <div className="auth-header">
            <div
              className="auth-logo"
              style={{ background: "transparent", marginBottom: "0rem" }}
            >
              <div
                className="auth-logo-icon"
                style={{
                  background: "transparent",
                  border: "none",
                  boxShadow: "none",
                  padding: 0,
                  width: 110,
                  height: 110,
                }}
              >
                <img
                  src="/assets/logo icon.png"
                  alt="Mehndi Me"
                  style={{ height: "auto", width: "auto" }}
                />
              </div>
            </div>
            <h1 className="auth-title">
              <img
                src="/assets/logo text.png"
                alt="Mehndi Me"
                style={{ height: 26 }}
              />
            </h1>
            {/* <p className="auth-subtitle">Email Verification</p> */}
          </div>

          <div
            className="verification-status"
            style={{ textAlign: "center", padding: "2rem 0" }}
          >
            {status === "verifying" && (
              <div style={{ color: "#d4a574" }}>
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    margin: "0 auto 1rem",
                    border: "4px solid #f3f3f3",
                    borderTop: "4px solid #d4a574",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                ></div>
                <p style={{ fontSize: "1.1rem", margin: "0" }}>{message}</p>{" "}
                <br />
              </div>
            )}

            {status === "success" && (
              <div
                className="success-message"
                style={{
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #86efac",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                }}
              >
                {/* Message and Icon Row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div
                    style={{
                      width: "50px",
                      height: "50px",
                      backgroundColor: "#dcfce7",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#16a34a"
                      strokeWidth="2"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22,4 12,14.01 9,11.01" />
                    </svg>
                  </div>
                  <p
                    style={{
                      color: "#166534",
                      fontSize: "1.1rem",
                      margin: 0,
                      fontWeight: "500",
                      flex: 1,
                    }}
                  >
                    {message}
                  </p>
                </div>

                {/* Button Row */}
                {/* <div style={{ 
                  display: 'flex', 
                  flexDirection: 'row',
                  gap: '1rem'
                }}>
                  <Link 
                    to="/login" 
                    className="auth-submit-btn" 
                    style={{ 
                      textDecoration: 'none', 
                      textAlign: 'center',
                      display: 'block',
                      backgroundColor: '#d4a574',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                      flex: 1,
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#b8945f';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#d4a574';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    Proceed to Login
                  </Link>
                </div> */}
              </div>
            )}

            {status === "error" && (
              <div
                className="error-message"
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                }}
              >
                {/* Message and Icon Row */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: "1rem",
                  }}
                >
                  <div
                    style={{
                      width: "50px",
                      height: "50px",
                      backgroundColor: "#fee2e2",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  </div>
                  <p
                    style={{
                      color: "#dc2626",
                      fontSize: "1.1rem",
                      margin: 0,
                      fontWeight: "500",
                      flex: 1,
                    }}
                  >
                    {message}
                  </p>
                </div>

                {/* Button Row */}
                {/* <div style={{ 
                  display: 'flex', 
                  flexDirection: 'row',
                  gap: '1rem'
                }}>
                  <Link 
                    to="/signup" 
                    className="auth-submit-btn" 
                    style={{ 
                      textDecoration: 'none', 
                      textAlign: 'center',
                      display: 'block',
                      backgroundColor: '#d4a574',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                      flex: 1,
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#b8945f';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#d4a574';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    Try Signup Again
                  </Link>
                </div> */}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
};

export default EmailVerification;
