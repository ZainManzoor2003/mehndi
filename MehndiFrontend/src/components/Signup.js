import { GoogleLogin } from "@react-oauth/google";
import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../services/api";
import Header from "./Header";
// No Header on auth pages

const Signup = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    city: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    userType: "client",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));

    // If userType changes, clear city requirement error
    if (name === "userType") {
      setErrors((prev) => ({ ...prev, city: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";

    // City is mandatory for clients, optional for artists
    if (formData.userType === "client" && !formData.city.trim()) {
      newErrors.city = "City is required";
    }
    // Phone required for both (for verification)
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (
      !/^\+?\d{10,15}$/.test(formData.phoneNumber.replace(/\s|-/g, ""))
    ) {
      newErrors.phoneNumber = "Enter a valid phone number";
    }

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "At least 6 characters";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({}); // Clear previous errors
    setSuccess(""); // Clear previous success message

    if (!validateForm()) return;
    setIsLoading(true);

    try {
      // The register function now doesn't log the user in automatically
      const response = await register(formData);

      // Show the success message from the backend (email verification sent)
      setSuccess(
        response.message ||
          "Registration successful! Please check your email to verify your account."
      );

      // Redirect to email check screen with email in query string
      try {
        const encodedEmail = encodeURIComponent(formData.email);
        const encodedPhone = encodeURIComponent(formData.phoneNumber);
        window.location.assign(
          `/check-email?email=${encodedEmail}&phone=${encodedPhone}`
        );
      } catch {}
    } catch (error) {
      setErrors({
        submit: error.message || "Registration failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setErrors({});
    setSuccess("");
    setIsLoading(true);

    try {
      console.log("Google signup successful:", credentialResponse);

      // Send the Google credential to backend for verification
      const response = await authAPI.googleAuth(credentialResponse.credential);

      console.log("Google OAuth response:", response);
      console.log("Token received:", response.token);

      if (response.success && response.token) {
        setSuccess("Google signup successful! Redirecting...");

        // Store the token
        localStorage.setItem("token", response.token);

        // Update AuthContext state - this will trigger PublicRoute to redirect
        updateUser(response.data.user);

        // Show password alert if message is provided
        if (response.message) {
          alert(response.message);
        }

        // No need for manual navigation - PublicRoute will handle it
      } else {
        setErrors({
          submit:
            response.message || "Google signup failed - no token received",
        });
      }
    } catch (error) {
      console.error("Google signup error:", error);
      setErrors({
        submit: error.message || "Google signup failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setErrors({ submit: "Google signup failed. Please try again." });
  };

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
            <p className="auth-subtitle">
              Book faster. Earn more. Stress less.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  className="form-input"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
                {errors.firstName && (
                  <div className="error-message inline">{errors.firstName}</div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="lastName" className="form-label">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  className="form-input"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
                {errors.lastName && (
                  <div className="error-message inline">{errors.lastName}</div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              {errors.email && (
                <div className="error-message inline">{errors.email}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="city" className="form-label">
                City{" "}
                {formData.userType === "client" && (
                  <span style={{ color: "#ef4444" }}>*</span>
                )}
              </label>
              <select
                id="city"
                name="city"
                className="form-input"
                value={formData.city}
                onChange={handleInputChange}
                required={formData.userType === "client"}
              >
                <option value="">Select your city</option>
                <option value="London">London</option>
                <option value="Birmingham">Birmingham</option>
                <option value="Manchester">Manchester</option>
                <option value="Bradford">Bradford</option>
              </select>
              {errors.city && (
                <div className="error-message inline">{errors.city}</div>
              )}
            </div>

            {/* Phone number (integrated country select) */}
            <div className="form-group">
              <label htmlFor="phoneNumber" className="form-label">
                Phone Number
              </label>
              <PhoneInput
                country={"gb"}
                onlyCountries={["gb", "pk"]}
                preferredCountries={["gb", "pk"]}
                inputProps={{
                  name: "phoneNumber",
                  id: "phoneNumber",
                  required: true,
                }}
                value={formData.phoneNumber}
                onChange={(value, data) => {
                  // react-phone-input-2 returns numbers without plus; store with + prefix
                  const full = value ? `+${value}` : "";
                  setFormData((prev) => ({ ...prev, phoneNumber: full }));
                  if (errors.phoneNumber)
                    setErrors((prev) => ({ ...prev, phoneNumber: "" }));
                }}
                placeholder={
                  formData.userType === "client"
                    ? "e.g. 7400123456"
                    : "Your phone number"
                }
                inputStyle={{ width: "100%" }}
                containerStyle={{ width: "100%" }}
                buttonStyle={{ border: "2px solid #e5e7eb" }}
                specialLabel={""}
              />
              {errors.phoneNumber && (
                <div className="error-message inline">{errors.phoneNumber}</div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                    <span className="password-toggle-text">
                      {showPassword ? "Hide" : "Show"}
                    </span>
                  </button>
                </div>
                {errors.password && (
                  <div className="error-message inline">{errors.password}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    className="form-input"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    <span className="password-toggle-text">
                      {showConfirmPassword ? "Hide" : "Show"}
                    </span>
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="error-message inline">
                    {errors.confirmPassword}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="userType" className="form-label">
                You are
              </label>
              <select
                id="userType"
                name="userType"
                className="form-input"
                value={formData.userType}
                onChange={handleInputChange}
              >
                <option value="client">I am a Client</option>
                <option value="artist">I am an Artist</option>
              </select>
            </div>

            {errors.submit && (
              <div className="error-message">{errors.submit}</div>
            )}

            {success && (
              <div
                className="success-message"
                style={{
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #86efac",
                  borderRadius: "8px",
                  padding: "1rem",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    backgroundColor: "#dcfce7",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
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
                    margin: 0,
                    fontSize: "0.95rem",
                    fontWeight: "500",
                    lineHeight: "1.4",
                  }}
                >
                  {success}
                </p>
              </div>
            )}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          <div className="social-login">
            <div className="google-btn-wrap">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                theme="outline"
                size="large"
                text="signup_with"
                shape="rectangular"
                width="100%"
              />
            </div>
          </div>

          {!isAuthenticated && (
            <div className="auth-footer">
              <p>
                Already have an account?{" "}
                <Link to="/login" className="auth-link">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Signup;
