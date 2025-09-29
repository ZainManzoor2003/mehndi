import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { FaEye, FaEyeSlash, FaUser, FaEnvelope, FaLock, FaEdit, FaSave, FaTimes } from 'react-icons/fa';

const ClientProfile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Initialize form data
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const validatePasswordForm = () => {
    if (!formData.currentPassword) {
      setError('Current password is required');
      return false;
    }
    if (!formData.newPassword) {
      setError('New password is required');
      return false;
    }
    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New password and confirm password do not match');
      return false;
    }
    return true;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email
      };

      // Add password fields if they are provided
      if (formData.currentPassword && formData.newPassword) {
        if (!validatePasswordForm()) {
          setIsLoading(false);
          return;
        }
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await authAPI.updateProfile(updateData);
      
      if (response.success) {
        setSuccess('Profile updated successfully!');
        updateUser(response.data.user);
        setIsEditing(false);
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        setError(response.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setError('');
    setSuccess('');
    setIsEditing(false);
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-main">
            <div className="profile-avatar">
              {user?.userProfileImage ? (
                <img 
                  src={user.userProfileImage} 
                  alt={`${user.firstName} ${user.lastName}`}
                  className="avatar-image"
                />
              ) : (
                <div className="avatar-placeholder">
                  <FaUser />
                </div>
              )}
            </div>
            <div className="profile-info">
              <h2 className="profile-name">{user?.firstName} {user?.lastName}</h2>
              <p className="profile-role">Client Account</p>
              <p className="profile-email">{user?.email}</p>
            </div>
          </div>
          <button 
            className={`profile-action-btn ${isEditing ? 'cancel' : 'edit'}`}
            onClick={isEditing ? handleCancelEdit : () => setIsEditing(true)}
          >
            {isEditing ? <><FaTimes /> Cancel</> : <><FaEdit /> Edit Profile</>}
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="alert-message error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
              <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
              <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="alert-message success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
            {success}
          </div>
        )}

        <div className="profile-content">
          {/* Combined Profile Form */}
          <form className="profile-form" onSubmit={handleUpdateProfile}>
            <div className="form-section">
              <h3 className="form-section-title">
                <FaUser className="section-icon" />
                Profile Information
              </h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="firstName" className="form-label">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your first name"
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName" className="form-label">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your last name"
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="email" className="form-label">
                    <FaEnvelope className="input-icon" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your email address"
                    disabled={!isEditing}
                    required
                  />
                </div>
              </div>

              {/* Password Section - Only show when editing */}
              {isEditing && (
                <>
                  <div className="password-section">
                    <h4 className="password-title">
                      <FaLock className="section-icon" />
                      Change Password (Optional)
                    </h4>
                    <p className="password-description">Leave password fields empty if you don't want to change your password.</p>
                    
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label htmlFor="currentPassword" className="form-label">Current Password</label>
                        <div className="password-input-wrapper">
                          <input
                            type={showPassword ? "text" : "password"}
                            id="currentPassword"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="newPassword" className="form-label">New Password</label>
                        <div className="password-input-wrapper">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            id="newPassword"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="Enter new password"
                            minLength="6"
                          />
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                        <small className="form-help">Password must be at least 6 characters long</small>
                      </div>

                      <div className="form-group">
                        <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                        <div className="password-input-wrapper">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="Confirm new password"
                            minLength="6"
                          />
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {isEditing && (
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="loading-spinner"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <FaSave />
                        Update Profile
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;
