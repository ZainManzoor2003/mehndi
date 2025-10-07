import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
// No Header on auth pages

const Signup = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'client'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'At least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await register(formData);
      navigate('/login');
    } catch (error) {
      setErrors({ submit: error.message || 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setErrors({});
    setSuccess('');
    setIsLoading(true);

    try {
      console.log('Google signup successful:', credentialResponse);
      
      // Send the Google credential to backend for verification
      const response = await authAPI.googleAuth(credentialResponse.credential);
      
      console.log('Google OAuth response:', response);
      console.log('Token received:', response.token);
      
      if (response.success && response.token) {
        setSuccess('Google signup successful! Redirecting...');
        
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
        setErrors({ submit: response.message || 'Google signup failed - no token received' });
      }
    } catch (error) {
      console.error('Google signup error:', error);
      setErrors({ submit: error.message || 'Google signup failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setErrors({ submit: 'Google signup failed. Please try again.' });
  };

  return (
    <>
      <Header />
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <div className="auth-logo-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <circle cx="12" cy="12" r="9"/>
                </svg>
              </div>
            </div>
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-subtitle">Book faster. Earn more. Stress less.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">First Name</label>
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
                {errors.firstName && <div className="error-message inline">{errors.firstName}</div>}
              </div>
              <div className="form-group">
                <label htmlFor="lastName" className="form-label">Last Name</label>
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
                {errors.lastName && <div className="error-message inline">{errors.lastName}</div>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="artist@mehndime.com"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              {errors.email && <div className="error-message inline">{errors.email}</div>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                    <span className="password-toggle-text">{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                {errors.password && <div className="error-message inline">{errors.password}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    <span className="password-toggle-text">{showConfirmPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                {errors.confirmPassword && <div className="error-message inline">{errors.confirmPassword}</div>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="userType" className="form-label">You are</label>
              <select id="userType" name="userType" className="form-input" value={formData.userType} onChange={handleInputChange}>
                <option value="client">I am a Client</option>
                <option value="artist">I am an Artist</option>
              </select>
            </div>

            {errors.submit && <div className="error-message">{errors.submit}</div>}
            
            {success && (
              <div className="success-message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
                {success}
              </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-divider"><span>or continue with</span></div>

          <div className="social-login">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              theme="outline"
              size="large"
              text="signup_with"
              shape="rectangular"
              width="100%"
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                border: '2px solid var(--light-beige)',
                background: 'var(--white-color)',
                color: 'var(--title-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease'
              }}
            />
            <button className="social-btn facebook-btn">
              <svg viewBox="0 0 24 24" className="social-icon">
                <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
          </div>

          {!isAuthenticated && (
            <div className="auth-footer">
              <p>
                Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Signup;
