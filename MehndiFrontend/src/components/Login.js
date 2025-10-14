import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
// No Header on auth pages

const Login = () => {
  const navigate = useNavigate();
  const { login, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const loginData = {
        email: formData.email,
        password: formData.password
      };

      console.log('Logging in user:', loginData);

      // Use AuthContext login function
      const response = await login(loginData);

      console.log('Login successful:', response);
      setSuccess('Login successful! Redirecting...');

      // Redirect after a short delay based on user type only
      setTimeout(() => {
        if (response.data.user.userType === 'artist') {
          navigate('/artist-dashboard');
        } else if (response.data.user.userType === 'admin') {
          navigate('/admin-dashboard/manage-clients');
        }
        else {
          navigate('/dashboard');
        }
      }, 1000);

    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      console.log('Google login successful:', credentialResponse);

      // Send the Google credential to backend for verification
      const response = await authAPI.googleAuth(credentialResponse.credential);

      console.log('Google OAuth response:', response);
      console.log('Token received:', response.token);

      if (response.success && response.token) {
        setSuccess('Google login successful! Redirecting...');

        // Store the token
        localStorage.setItem('token', response.token);

        // Update AuthContext state - this will trigger PublicRoute to redirect
        updateUser(response.data.user);

        // Show password alert if message is provided
        if (response.message) {
          alert(response.message);
        }

        // No need for manual navigation - PublicRoute will handle it
      } else {
        setError(response.message || 'Google login failed - no token received');
      }
    } catch (error) {
      console.error('Google login error:', error);
      setError(error.message || 'Google login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.');
  };

  return (
    <>
      <Header />
      <div className="auth-container" style={{marginTop: '6.5rem'}}>
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo" style={{ background: 'transparent', marginBottom: '0rem' }}>
              <div className="auth-logo-icon" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0, width: 110, height: 110 }}>
                <img src="/assets/logo icon.png" alt="Mehndi Me" style={{ height: 'auto', width: 'auto',}} />
              </div>
            </div>
            <h1 className="auth-title">
              <img src="/assets/logo text.png" alt="Mehndi Me" style={{ height: 26 }} />
            </h1>
            <p className="auth-subtitle">Book faster. Earn more. Stress less.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div className="error-message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className="success-message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22,4 12,14.01 9,11.01" />
                </svg>
                {success}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email or Username</label>
              <input
                type="text"
                id="email"
                name="email"
                className="form-input"
                placeholder="artist@mehndime.com"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="password" className="form-label">Password</label>
                <Link to="/forgot-password" className="forgot-link">Forgot?</Link>
              </div>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                  <span className="password-toggle-text">
                    {showPassword ? 'Hide' : 'Show'}
                  </span>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="checkbox-input"
                />
                <span className="checkbox-text">Remember me</span>
              </label>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <svg className="loading-spinner" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="31.416" strokeDashoffset="31.416">
                      <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite" />
                      <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite" />
                    </circle>
                  </svg>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
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
                text="signin_with"
                shape="rectangular"
                width="100%"
              />
            </div>
          </div>

          <div className="auth-footer">
            <p>
              Don't have an account? <Link
                to="/signup"
                className="auth-link"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login; 