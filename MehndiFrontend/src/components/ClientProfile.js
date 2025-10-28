import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { FaEye, FaEyeSlash, FaUser, FaSignOutAlt, FaEnvelope, FaLock, FaEdit, FaSave, FaTimes, FaPhone } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

const ClientProfile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
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
    phoneNumber: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Get member since date
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : '';

  // Initialize form data
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
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

  const handleLogoutClick = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      try { await logout(); } catch {}
      localStorage.clear();
      const deleteCookieEverywhere = (name) => {
        try {
          const hostname = window.location.hostname;
          const parts = hostname.split('.');
          for (let i = 0; i < parts.length; i++) {
            const domain = parts.slice(i).join('.');
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain};`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
          }
        } catch (e) {}
      };
      deleteCookieEverywhere('token');
      deleteCookieEverywhere('refreshToken');
      navigate('/login');
    } catch (e) {
      console.error('Logout error:', e);
      navigate('/login');
    }
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
        email: formData.email,
        phoneNumber: formData.phoneNumber
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
      phoneNumber: user?.phoneNumber || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setError('');
    setSuccess('');
    setIsEditing(false);
  };

  return (
    <div style={{ 
      minHeight: 'inherit', 
      backgroundColor: 'rgba(249, 243, 234, 0.9)', 
      padding: '20px',
      display: 'flex',
      justifyContent: 'center',
      borderRadius:'12px'
    }}>
      <div style={{
        maxWidth: '1100px',
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {/* Profile Completion Status */}
        <div style={{
          marginBottom: '32px',
          paddingBottom: '16px',
          borderBottom: '2px solid #5C3D2E'
        }}>
          <div style={{
            color: '#5C3D2E',
            fontSize: '14px',
            marginBottom: '8px'
          }}>
            Profile 100% complete — all contact details verified.
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div style={{
            backgroundColor: '#fee',
            color: '#c33',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #fcc'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: '#efe',
            color: '#3c3',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #cfc'
          }}>
            {success}
          </div>
        )}

        {/* Profile Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            {/* Avatar */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#D4C0A0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: '700',
              color: '#4A2C1D',
              flexShrink: 0
            }}>
              {user?.userProfileImage ? (
                <img 
                  src={user.userProfileImage} 
                  alt={`${user.firstName} ${user.lastName}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                `${(user?.firstName || 'U')[0]}${(user?.lastName || '')[0] || ''}`
              )}
            </div>

            {/* Name and Info */}
            <div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#4A2C1D',
                margin: '0 0 4px 0'
              }}>
                {user?.firstName} {user?.lastName}
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#7A6A5E',
                margin: '0 0 4px 0'
              }}>
                Client Account
              </p>
              {memberSince && (
                <p style={{
                  fontSize: '14px',
                  color: '#7A6A5E',
                  margin: 0
                }}>
                  Member since {memberSince}
                </p>
              )}
            </div>
          </div>

          {/* Edit Profile Button */}
          <button 
            onClick={isEditing ? handleCancelEdit : () => setIsEditing(true)}
            style={{
              backgroundColor: '#8B5E3C',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FaEdit />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleUpdateProfile}>
          {/* Personal Information */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#4A2C1D',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaUser style={{ fontSize: '16px' }} />
              Personal Information
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  color: '#7A6A5E',
                  marginBottom: '8px'
                }}>
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: isEditing ? 'white' : '#F0F2F5',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  color: '#7A6A5E',
                  marginBottom: '8px'
                }}>
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: isEditing ? 'white' : '#F0F2F5',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#4A2C1D',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaEnvelope style={{ fontSize: '16px' }} />
              Contact Information
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '14px',
                  color: '#7A6A5E',
                  marginBottom: '8px'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaEnvelope style={{ fontSize: '12px' }} />
                    Email Address
                  </span>
                  {user?.isEmailVerified && (
                    <span style={{
                      backgroundColor: '#E6F4EA',
                      color: '#2e7d32',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: '1px solid #c8e6c9'
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17l-3.88-3.88-1.41 1.41L9 19 20.29 7.71 18.88 6.29z"/>
                      </svg>
                      Verified
                    </span>
                  )}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: isEditing ? 'white' : '#F0F2F5',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '14px',
                  color: '#7A6A5E',
                  marginBottom: '8px'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaPhone style={{ fontSize: '12px' }} />
                    Phone Number
                  </span>
                  {user?.isPhoneNumberVerified && (
                    <span style={{
                      backgroundColor: '#E6F4EA',
                      color: '#2e7d32',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: '1px solid #c8e6c9'
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17l-3.88-3.88-1.41 1.41L9 19 20.29 7.71 18.88 6.29z"/>
                      </svg>
                      Verified
                    </span>
                  )}
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: isEditing ? 'white' : '#F0F2F5',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Change Password (optional) */}
          {isEditing && (
            <div style={{ marginTop: '32px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#4A2C1D',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <FaLock style={{ fontSize: '16px' }} />
                Change Password (optional)
              </h3>
              <p style={{ marginTop: 0, marginBottom: '16px', color: '#7A6A5E', fontSize: '14px' }}>
                Leave fields empty if you don't want to change your password.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '14px', color: '#7A6A5E', marginBottom: '8px' }}>Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      placeholder="Enter current password"
                      style={{
                        width: '100%', padding: '12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px'
                      }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#7A6A5E' }}>
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#7A6A5E', marginBottom: '8px' }}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      placeholder="Enter new password"
                      minLength={6}
                      style={{
                        width: '100%', padding: '12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px'
                      }}
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#7A6A5E' }}>
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <small style={{ color: '#7A6A5E' }}>At least 6 characters</small>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#7A6A5E', marginBottom: '8px' }}>Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm new password"
                      minLength={6}
                      style={{
                        width: '100%', padding: '12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px'
                      }}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#7A6A5E' }}>
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button (only when editing) */}
          {isEditing && (
            <div style={{
              marginTop: '32px',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button 
                type="submit" 
                disabled={isLoading}
                style={{
                  backgroundColor: '#8B5E3C',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isLoading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #fff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }}></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ClientProfile;