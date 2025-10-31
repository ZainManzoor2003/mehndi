import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import GetLocationModal from './modals/GetLocationModal';

const { bookingsAPI } = apiService;

const BookingForm = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [linkInput, setLinkInput] = useState('');
  
  const [formData, setFormData] = useState({
    // Contact Details
    fullName: '',
    
    // Event Details
    eventType: '',
    otherEventType: '',
    eventDate: '',
    preferredTimeSlot: '',
    location: '',
    latitude: '',
    longitude: '',
    artistTravelsToClient: '',
    venueName: '',
    
    // Mehndi Style
    stylePreference: '',
    designInspiration: '',
    coveragePreference: '',
    
    // Budget & Notes
    budgetFrom: '',
    budgetTo: '',
    numberOfPeople: 1,
    additionalRequests: ''
  });

  const [showLocationModal, setShowLocationModal] = useState(false);

  // Handler for location selection from modal (store coordinates only; city is chosen via dropdown)
  const handleLocationSelect = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString()
    }));
    setShowLocationModal(false);
  };

  // Cloudinary upload function
  const uploadToCloudinary = async (file, resourceType = 'image') => {
    const url = `https://api.cloudinary.com/v1_1/dfoetpdk9/${resourceType}/upload`;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', 'mehndi');
    const res = await fetch(url, { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Upload failed');
    return data.secure_url || data.url;
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(file => uploadToCloudinary(file));
      const urls = await Promise.all(uploadPromises);
      setUploadedImages(prev => [...prev, ...urls]);
      // Update designInspiration with all image URLs
      const allImages = [...uploadedImages, ...urls];
      setFormData(prev => ({
        ...prev,
        designInspiration: allImages.join('\n')
      }));
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddLink = () => {
    if (!linkInput.trim()) return;
    
    const newImages = [...uploadedImages, linkInput.trim()];
    setUploadedImages(newImages);
    setFormData(prev => ({
      ...prev,
      designInspiration: newImages.join('\n')
    }));
    setLinkInput('');
  };

  const handleRemoveImage = (index) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    setFormData(prev => ({
      ...prev,
      designInspiration: newImages.join('\n')
    }));
  };

  const steps = [
    { id: 1, name: 'Contact' },
    { id: 2, name: 'Event' },
    { id: 3, name: 'Style' },
    { id: 4, name: 'Budget' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
        setFormData(prev => ({
          ...prev,
          [name]: checked 
            ? [...prev[name], value]
            : prev[name].filter(item => item !== value)
        }));
    } else if (type === 'radio') {
      setFormData(prev => ({
        ...prev,
        [name]: value
        }));
      } else {
        setFormData(prev => ({
          ...prev,
        [name]: value
        }));
      }
  };

  // Special handler for style preference (single selection)
  const handleStyleChange = (value) => {
      setFormData(prev => ({
        ...prev,
      stylePreference: value
      }));
  };

  const handleNumberChange = (field, increment) => {
      setFormData(prev => ({
        ...prev,
      [field]: Math.max(1, prev[field] + increment)
      }));
  };

  const handlePresetBudget = (from, to) => {
      setFormData(prev => ({
        ...prev,
      budgetFrom: from,
      budgetTo: to
      }));
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isAuthenticated) {
      setError('Please log in to submit a booking request');
      return;
    }

    // Validate required fields
    if (!formData.fullName) {
      setCurrentStep(1);
      setError('Please enter your full name');
      return;
    }

    if (!formData.eventType || !formData.eventDate || !formData.preferredTimeSlot || 
        !formData.location || !formData.artistTravelsToClient) {
      setCurrentStep(2);
      setError('Please complete Event Details');
      return;
    }

    if (!formData.stylePreference) {
      setCurrentStep(3);
      setError('Please select a style preference');
      return;
    }
    if(formData.stylePreference === 'Bridal Mehndi' && !formData.venueName) {
      setCurrentStep(2);
      setError('Venue name is required for bridal mehndi');
      return;
    }
    if(formData.stylePreference === 'Bridal Mehndi' && !formData.coveragePreference) {
      setCurrentStep(3);
      setError('Coverage preference is required for bridal mehndi');
      return; 
    }

    if (!formData.budgetFrom || !formData.budgetTo || !formData.numberOfPeople) {
        setCurrentStep(4);
      setError('Please complete Budget information');
      return;
    }

    const budgetFrom = parseInt(formData.budgetFrom);
    const budgetTo = parseInt(formData.budgetTo);

    if (budgetTo <= budgetFrom) {
      setError('Maximum budget must be greater than minimum budget');
      return;
    }

    // Check if event date is in the future
    const eventDate = new Date(formData.eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (eventDate <= today) {
      setCurrentStep(2);
      setError('Event date must be in the future');
      return;
    }

    setIsLoading(true);

    try {
      // Transform to match backend expectations
      const nameParts = formData.fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const bookingData = {
        firstName,
        lastName,
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || '',
        eventType: [formData.eventType],
        otherEventType: formData.otherEventType || undefined,
        eventDate: formData.eventDate,
        preferredTimeSlot: [formData.preferredTimeSlot],
        location: formData.location,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
        artistTravelsToClient: formData.artistTravelsToClient === 'both' ? 'both' : formData.artistTravelsToClient === 'yes',
        venueName: formData.venueName || undefined,
        minimumBudget: budgetFrom,
        maximumBudget: budgetTo,
        numberOfPeople: parseInt(formData.numberOfPeople),
        designStyle: formData.stylePreference,
        designInspiration: uploadedImages.length > 0 ? uploadedImages : [],
        coveragePreference: formData.coveragePreference || undefined,
        additionalRequests: formData.additionalRequests || undefined,
        duration: 3
      };

      const response = await bookingsAPI.createBooking(bookingData);
      
      setSuccess('Your booking request has been submitted successfully!');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Booking creation error:', error);
      setError(error.message || 'Failed to submit booking request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="booking-container">
        <div className="booking-form-container">
          {/* Progress Bar */}
          <div className="progress-bar">
            {steps.map((step, index) => (
              <div key={step.id} className="progress-step-container">
              <div className={`progress-step ${currentStep >= step.id ? 'active' : ''} ${currentStep === step.id ? 'current' : ''}`}>
                  <span className="step-number">{step.id}</span>
                  <span className="step-name">{step.name}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`progress-line ${currentStep > step.id ? 'completed' : ''}`}></div>
                )}
              </div>
            ))}
          </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            color: '#8B4513', 
            marginBottom: '0.5rem',
            fontWeight: '600'
          }}>
            Post a Mehndi Request
          </h1>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#666',
            fontStyle: 'italic'
          }}>
            Tell Us What You Need – Artists Will Apply to You!
          </p>
          <p style={{ 
            fontSize: '0.95rem', 
            color: '#888',
            marginTop: '0.5rem'
          }}>
            Sit back and let artists send you offers based on your event, budget, and style.
          </p>
          </div>

          <form className="booking-form" onSubmit={handleSubmit}>
            {/* Step 1: Contact Details */}
            {currentStep === 1 && (
              <div className="form-step">
                <div className="step-header">
                  <h2 className="step-title">Contact Details</h2>
                <p className="step-subtitle">We'll use your account information</p>
                </div>
                
                  <div className="form-group">
                <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                  name="fullName"
                      className="form-input"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                      onChange={handleInputChange}
                      required
                    />
                </div>
              </div>
            )}

            {/* Step 2: Event Details */}
            {currentStep === 2 && (
              <div className="form-step">
                <div className="step-header">
                  <h2 className="step-title">🎉 Event Details</h2>
                  <p className="step-subtitle">Tell us about your special occasion</p>
                </div>

              {/* Event Type */}
                <div className="form-group">
                  <label className="form-label">Event Type *</label>
                <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1rem' }}>
                  Choose the event you are booking for
                </p>
                <div className="event-option-grid">
                  <label className={`event-option ${formData.eventType === 'Wedding' ? 'selected' : ''}`}>
                      <input
                      type="radio"
                        name="eventType"
                        value="Wedding"
                      checked={formData.eventType === 'Wedding'}
                        onChange={handleInputChange}
                      style={{ display: 'none' }}
                    />
                    <span className="event-emoji">💍</span>
                    <span className="event-text">Wedding</span>
                    {formData.eventType === 'Wedding' && (
                      <span className="checkmark">✓</span>
                    )}
                    </label>
                  <label className={`event-option ${formData.eventType === 'Eid' ? 'selected' : ''}`}>
                      <input
                      type="radio"
                        name="eventType"
                        value="Eid"
                      checked={formData.eventType === 'Eid'}
                        onChange={handleInputChange}
                      style={{ display: 'none' }}
                    />
                    <span className="event-emoji">🌙</span>
                    <span className="event-text">Eid</span>
                    {formData.eventType === 'Eid' && (
                      <span className="checkmark">✓</span>
                    )}
                    </label>
                  <label className={`event-option ${formData.eventType === 'Party' ? 'selected' : ''}`}>
                      <input
                      type="radio"
                        name="eventType"
                        value="Party"
                      checked={formData.eventType === 'Party'}
                        onChange={handleInputChange}
                      style={{ display: 'none' }}
                    />
                    <span className="event-emoji">🎉</span>
                    <span className="event-text">Party</span>
                    {formData.eventType === 'Party' && (
                      <span className="checkmark">✓</span>
                    )}
                    </label>
                  <label className={`event-option ${formData.eventType === 'Festival' ? 'selected' : ''}`}>
                      <input
                      type="radio"
                        name="eventType"
                        value="Festival"
                      checked={formData.eventType === 'Festival'}
                        onChange={handleInputChange}
                      style={{ display: 'none' }}
                    />
                    <span className="event-emoji">🎊</span>
                    <span className="event-text">Festival</span>
                    {formData.eventType === 'Festival' && (
                      <span className="checkmark">✓</span>
                    )}
                    </label>
                  </div>
                  <input
                    type="text"
                    name="otherEventType"
                    className="form-input"
                  style={{ marginTop: '1rem' }}
                    placeholder="Other:"
                    value={formData.otherEventType}
                    onChange={handleInputChange}
                  />
                </div>

              {/* Event Date */}
                <div className="form-group">
                  <label className="form-label">Event Date *</label>
                <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '0.5rem' }}>
                  Select the date of your occasion
                </p>
                  <input
                    type="date"
                    name="eventDate"
                    className="form-input"
                    value={formData.eventDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

              {/* Preferred Time Slot */}
                <div className="form-group">
                  <label className="form-label">Preferred Time Slot *</label>
                <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1rem' }}>
                  Pick one option
                </p>
                <div className="time-slot-grid">
                  <label className={`time-slot-option ${formData.preferredTimeSlot === 'Morning' ? 'selected' : ''}`}>
                      <input
                      type="radio"
                        name="preferredTimeSlot"
                        value="Morning"
                      checked={formData.preferredTimeSlot === 'Morning'}
                        onChange={handleInputChange}
                      style={{ display: 'none' }}
                      />
                    <span className="time-icon">☀️</span>
                    <span className="time-text">Morning</span>
                    </label>
                  <label className={`time-slot-option ${formData.preferredTimeSlot === 'Afternoon' ? 'selected' : ''}`}>
                      <input
                      type="radio"
                        name="preferredTimeSlot"
                        value="Afternoon"
                      checked={formData.preferredTimeSlot === 'Afternoon'}
                        onChange={handleInputChange}
                      style={{ display: 'none' }}
                      />
                    <span className="time-icon">🌤️</span>
                    <span className="time-text">Afternoon</span>
                    </label>
                  <label className={`time-slot-option ${formData.preferredTimeSlot === 'Evening' ? 'selected' : ''}`}>
                      <input
                      type="radio"
                        name="preferredTimeSlot"
                        value="Evening"
                      checked={formData.preferredTimeSlot === 'Evening'}
                        onChange={handleInputChange}
                      style={{ display: 'none' }}
                      />
                    <span className="time-icon">🌙</span>
                    <span className="time-text">Evening</span>
                    </label>
                  <label className={`time-slot-option ${formData.preferredTimeSlot === 'Flexible' ? 'selected' : ''}`}>
                      <input
                      type="radio"
                        name="preferredTimeSlot"
                        value="Flexible"
                      checked={formData.preferredTimeSlot === 'Flexible'}
                        onChange={handleInputChange}
                      style={{ display: 'none' }}
                      />
                    <span className="time-icon">🔄</span>
                    <span className="time-text">Flexible</span>
                    </label>
                  </div>
                </div>

              {/* Location */}
                <div className="form-group">
                  <label className="form-label">Location / Postcode *</label>
                <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1rem' }}>
                  Click "Get Location" to select your location on the map
                </p>
                  <button
                    type="button"
                    onClick={() => setShowLocationModal(true)}
                    style={{
                      padding: '14px 32px',
                      background: '#faf8f5',
                      border: '2px solid #CD853F',
                      borderRadius: '10px',
                      color: '#8B4513',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '1rem',
                      boxShadow: '0 2px 8px rgba(205, 133, 63, 0.15)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#fff8f0';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(205, 133, 63, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#faf8f5';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 8px rgba(205, 133, 63, 0.15)';
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>📍</span> Get Location
                  </button>
                  {/* City Dropdown */}
                  <div style={{ marginTop: '12px' }}>
                    <select
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      style={{
                        width: '100%',
                        height: '44px',
                        border: '1px solid #ced4da',
                        borderRadius: '8px',
                        padding: '0 12px',
                        background: '#ffffff',
                        color: '#0f172a'
                      }}
                    >
                      <option value="">Select city</option>
                      <option value="London">London</option>
                      <option value="Birmingham">Birmingham</option>
                      <option value="Manchester">Manchester</option>
                      <option value="Bradford">Bradford</option>
                    </select>
                  </div>
                  {formData.location && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '12px 16px',
                      background: '#f0f8f0',
                      border: '1px solid #c8e6c9',
                      borderRadius: '8px',
                      color: '#2e7d32',
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      <span>{formData.location}</span>
                    </div>
                  )}
                </div>

              {/* Travel Preference */}
                <div className="form-group">
                  <label className="form-label">Do you want the artist to come to you? *</label>
                <div className="travel-option-grid">
                  <label className={`travel-option ${formData.artistTravelsToClient === 'yes' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="artistTravelsToClient"
                        value="yes"
                      checked={formData.artistTravelsToClient === 'yes'}
                        onChange={handleInputChange}
                      style={{ display: 'none' }}
                      />
                    <span className="travel-icon">🚗</span>
                    <span className="travel-text">Yes, come to my home</span>
                    </label>
                  <label className={`travel-option ${formData.artistTravelsToClient === 'no' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="artistTravelsToClient"
                        value="no"
                      checked={formData.artistTravelsToClient === 'no'}
                        onChange={handleInputChange}
                      style={{ display: 'none' }}
                      />
                    <span className="travel-icon">🏡</span>
                    <span className="travel-text">No, I'll travel to the artist</span>
                    </label>
                  <label className={`travel-option ${formData.artistTravelsToClient === 'both' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="artistTravelsToClient"
                        value="both"
                      checked={formData.artistTravelsToClient === 'both'}
                        onChange={handleInputChange}
                      style={{ display: 'none' }}
                      />
                    <span className="travel-icon">🤝</span>
                    <span className="travel-text">I'm open to both</span>
                    </label>
                  </div>
                </div>

              {/* Venue Name (Optional) */}
              <div className="form-group">
                <label className="form-label">Venue Name * (for bridal only)</label>
                <input
                  type="text"
                  name="venueName"
                  className="form-input"
                  placeholder="Enter venue name (optional)"
                  value={formData.venueName}
                  onChange={handleInputChange}
                />
                </div>
              </div>
            )}

          {/* Step 3: Mehndi Style */}
            {currentStep === 3 && (
              <div className="form-step">
                <div className="step-header">
                <h2 className="step-title">Mehndi Style</h2>
                <p className="step-subtitle">Tell us about your preferred style</p>
                </div>

              {/* Style Preference */}
                <div className="form-group">
                <label className="form-label">Style You're Looking For *</label>
                <div className="style-option-grid">
                  <label className={`style-option ${formData.stylePreference === 'Bridal Mehndi' ? 'selected' : ''}`}
                    onClick={() => handleStyleChange('Bridal Mehndi')}
                    style={{ cursor: 'pointer' }}
                  >
                      <input
                      type="radio"
                      name="stylePreference"
                      value="Bridal Mehndi"
                      checked={formData.stylePreference === 'Bridal Mehndi'}
                      onChange={() => handleStyleChange('Bridal Mehndi')}
                      style={{ display: 'none' }}
                    />
                    <span>Bridal Mehndi</span>
                    {formData.stylePreference === 'Bridal Mehndi' && (
                      <span className="checkmark">✓</span>
                    )}
                    </label>
                  <label className={`style-option ${formData.stylePreference === 'Party Mehndi' ? 'selected' : ''}`}
                    onClick={() => handleStyleChange('Party Mehndi')}
                    style={{ cursor: 'pointer' }}
                  >
                      <input
                      type="radio"
                      name="stylePreference"
                      value="Party Mehndi"
                      checked={formData.stylePreference === 'Party Mehndi'}
                      onChange={() => handleStyleChange('Party Mehndi')}
                      style={{ display: 'none' }}
                    />
                    <span>Party Mehndi</span>
                    {formData.stylePreference === 'Party Mehndi' && (
                      <span className="checkmark">✓</span>
                    )}
                    </label>
                  <label className={`style-option ${formData.stylePreference === 'Festival Mehndi' ? 'selected' : ''}`}
                    onClick={() => handleStyleChange('Festival Mehndi')}
                    style={{ cursor: 'pointer' }}
                  >
                      <input
                      type="radio"
                      name="stylePreference"
                      value="Festival Mehndi"
                      checked={formData.stylePreference === 'Festival Mehndi'}
                      onChange={() => handleStyleChange('Festival Mehndi')}
                      style={{ display: 'none' }}
                    />
                    <span>Festival Mehndi</span>
                    {formData.stylePreference === 'Festival Mehndi' && (
                      <span className="checkmark">✓</span>
                    )}
                    </label>
                  <label className={`style-option ${formData.stylePreference === 'Casual / Minimal Mehndi' ? 'selected' : ''}`}
                    onClick={() => handleStyleChange('Casual / Minimal Mehndi')}
                    style={{ cursor: 'pointer' }}
                  >
                      <input
                      type="radio"
                      name="stylePreference"
                      value="Casual / Minimal Mehndi"
                      checked={formData.stylePreference === 'Casual / Minimal Mehndi'}
                      onChange={() => handleStyleChange('Casual / Minimal Mehndi')}
                      style={{ display: 'none' }}
                    />
                    <span>Casual / Minimal Mehndi</span>
                    {formData.stylePreference === 'Casual / Minimal Mehndi' && (
                      <span className="checkmark">✓</span>
                    )}
                    </label>
                  </div>
                </div>

              {/* Design Inspiration */}
                <div className="form-group">
                  <label className="form-label">Design Inspiration</label>
                <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1rem' }}>
                  Upload images or paste links to share your preferred designs
                </p>
                
                {/* Upload Images */}
                <div style={{ marginBottom: '1rem' }}>
                  <label 
                    className="upload-button"
                    style={{
                      display: 'inline-block',
                      padding: '12px 24px',
                      background: '#faf8f5',
                      border: '2px dashed #CD853F',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      color: '#8B4513',
                      fontWeight: '500',
                      transition: 'all 0.3s'
                    }}
                  >
                    {uploading ? 'Uploading...' : '📸 Upload Images'}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      style={{ display: 'none' }}
                    />
                  </label>
                  </div>

                {/* Paste Link */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input
                    type="url"
                      className="form-input"
                    placeholder="Paste image link here..."
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddLink();
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleAddLink}
                    disabled={!linkInput.trim()}
                    style={{
                      padding: '12px 24px',
                      background: '#CD853F',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      opacity: linkInput.trim() ? 1 : 0.6
                    }}
                  >
                    Add
                  </button>
                </div>

                {/* Uploaded Images Preview */}
                {uploadedImages.length > 0 && (
                  <div style={{ 
                    marginTop: '1rem',
                    padding: '1rem',
                    background: '#f9f9f9',
                    borderRadius: '10px',
                    border: '1px solid #e0d5c9'
                  }}>
                    <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#8B4513' }}>
                      Your Inspiration Images ({uploadedImages.length}):
                    </strong>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                      gap: '0.75rem' 
                    }}>
                      {uploadedImages.map((url, index) => (
                        <div 
                          key={index}
                          style={{
                            position: 'relative',
                            aspectRatio: '1',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '2px solid #e0d5c9'
                          }}
                        >
                          <img 
                            src={url} 
                            alt={`Inspiration ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/100';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: 'rgba(255, 0, 0, 0.8)',
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              lineHeight: '1'
                            }}
                            title="Remove image"
                          >
                            ×
                          </button>
                  </div>
                      ))}
                  </div>
                  </div>
                )}
                </div>

              {/* Coverage Preference */}
                <div className="form-group">
                <label className="form-label">Coverage Preference * (for bridal only)</label>
                <select
                  name="coveragePreference"
                    className="form-input"
                  value={formData.coveragePreference}
                    onChange={handleInputChange}
                >
                  <option value="">Select coverage</option>
                  <option value="Full arms & feet">Full arms & feet</option>
                  <option value="Hands only">Hands only</option>
                  <option value="Simple, elegant design">Simple, elegant design</option>
                  <option value="Not sure yet">Not sure yet</option>
                </select>
                </div>
            </div>
          )}

          {/* Step 4: Budget & Notes */}
          {currentStep === 4 && (
            <div className="form-step">
              <div className="step-header">
                <h2 className="step-title">Budget & Notes</h2>
                <p className="step-subtitle">Help artists tailor their offers to you</p>
              </div>

              {/* Budget Range */}
                  <div className="form-group">
                <label className="form-label">What's your budget range? *</label>
                <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1rem' }}>
                  Helps artists tailor their offers to you.
                </p>
                <div className="budget-input-row">
                  <div className="budget-input">
                    <span className="currency">£</span>
                    <input
                      type="number"
                      name="budgetFrom"
                      className="budget-field"
                      placeholder="From"
                      value={formData.budgetFrom}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="budget-input">
                    <span className="currency">£</span>
                    <input
                      type="number"
                      name="budgetTo"
                      className="budget-field"
                      placeholder="To"
                      value={formData.budgetTo}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Preset Budget Buttons */}
                <div className="budget-preset-buttons">
                  <button
                    type="button"
                    className={`budget-preset ${formData.budgetFrom === '50' && formData.budgetTo === '100' ? 'selected' : ''}`}
                    onClick={() => handlePresetBudget('50', '100')}
                  >
                    Under £100
                  </button>
                  <button
                    type="button"
                    className={`budget-preset ${formData.budgetFrom === '100' && formData.budgetTo === '250' ? 'selected' : ''}`}
                    onClick={() => handlePresetBudget('100', '250')}
                  >
                    £100 - £250
                  </button>
                  <button
                    type="button"
                    className={`budget-preset ${formData.budgetFrom === '250' && formData.budgetTo === '500' ? 'selected' : ''}`}
                    onClick={() => handlePresetBudget('250', '500')}
                  >
                    £250 - £500
                  </button>
                  <button
                    type="button"
                    className={`budget-preset ${formData.budgetFrom === '500' && formData.budgetTo === '1000' ? 'selected' : ''}`}
                    onClick={() => handlePresetBudget('500', '1000')}
                  >
                    £500+
                  </button>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '1rem' }}>
                  Final price may vary depending on design, travel, and number of people. You'll receive a full quote before confirming your booking.
                </p>
              </div>

              {/* Number of People */}
                <div className="form-group">
                <label className="form-label">How many people need Mehndi? (for group bookings) *</label>
                <div className="number-selector">
                  <button
                    type="button"
                    className="number-btn"
                    onClick={() => handleNumberChange('numberOfPeople', -1)}
                  >
                    -
                  </button>
                  <span className="number-display">{formData.numberOfPeople}</span>
                  <button
                    type="button"
                    className="number-btn"
                    onClick={() => handleNumberChange('numberOfPeople', 1)}
                  >
                    +
                  </button>
                    </div>
                </div>

              {/* Additional Notes */}
                <div className="form-group">
                <label className="form-label">Anything else artists should know?</label>
                <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.5rem' }}>
                  E.g. "Please bring your own cones," "We'll be outdoors," "Prefer traditional Indian patterns," "I have a henna allergy – need natural only," "Parking is limited on my road," or "I'm flexible with timing"
                </p>
                  <textarea
                    name="additionalRequests"
                    className="form-textarea"
                  placeholder="Write your notes here..."
                    value={formData.additionalRequests}
                    onChange={handleInputChange}
                    rows="4"
                  />
                </div>
              </div>
            )}

            {/* Error and Success Messages */}
            {error && (
            <div className="error-message" style={{
              backgroundColor: '#fee',
              color: '#c33',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '1rem',
              border: '1px solid #fcc'
            }}>
                {error}
              </div>
            )}
            
            {success && (
            <div className="success-message" style={{
              backgroundColor: '#dfc',
              color: '#3a3',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '1rem',
              border: '1px solid #9c9'
            }}>
                {success}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="form-navigation">
              {currentStep > 1 && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handlePrevStep}
                  disabled={isLoading}
                >
                  Previous
                </button>
              )}
              
            {currentStep < 4 ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleNextStep}
                  disabled={isLoading}
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn-primary btn-submit"
                  disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .booking-container {
          min-height: 100vh;
          padding: 2rem 1rem;
          background: linear-gradient(135deg, #f5f0e8 0%, #e8ddd4 100%);
        }

        .booking-form-container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          padding: 2.5rem;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }

        .progress-bar {
          display: flex;
          justify-content: center;
          margin-bottom: 2.5rem;
          gap: 0.5rem;
        }

        .progress-step {
          text-align: center;
        }

        .step-number {
          display: inline-block;
          width: 50px;
          height: 50px;
          line-height: 50px;
          border-radius: 50%;
          background: #e8ddd4;
          color: #8B4513;
          font-weight: bold;
          margin-bottom: 0.5rem;
          transition: all 0.3s;
        }

        .progress-step.active .step-number {
          background: #D2691E;
          color: white;
        }

        .progress-step.current .step-number {
          background: #CD853F;
          box-shadow: 0 0 0 5px rgba(205, 133, 63, 0.2);
        }

        .step-name {
          font-size: 0.9rem;
          color: #666;
        }

        .form-group {
          margin-bottom: 1.8rem;
        }

        .form-label {
          display: block;
          font-weight: 600;
          color: #8B4513;
          margin-bottom: 0.5rem;
          font-size: 1.05rem;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e0d5c9;
          border-radius: 10px;
          font-size: 1rem;
          background: #faf8f5;
          transition: all 0.3s;
        }

        .form-input:focus {
          outline: none;
          border-color: #CD853F;
          background: white;
          box-shadow: 0 0 0 3px rgba(205, 133, 63, 0.1);
        }

        .form-textarea {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e0d5c9;
          border-radius: 10px;
          font-size: 1rem;
          background: #faf8f5;
          font-family: inherit;
          resize: vertical;
          transition: all 0.3s;
        }

        .form-textarea:focus {
          outline: none;
          border-color: #CD853F;
          background: white;
          box-shadow: 0 0 0 3px rgba(205, 133, 63, 0.1);
        }

        .event-option-grid, .time-slot-grid, .travel-option-grid, .style-option-grid {
          display: grid;
          gap: 1rem;
        }

        .event-option-grid, .time-slot-grid, .travel-option-grid {
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        }

        .event-option, .time-slot-option, .travel-option, .style-option {
          display: flex;
          align-items: center;
          padding: 16px;
          border: 2px solid #e0d5c9;
          border-radius: 12px;
          background: #faf8f5;
          cursor: pointer;
          transition: all 0.3s;
          gap: 12px;
          position: relative;
        }

        .event-option:hover, .time-slot-option:hover, .travel-option:hover, .style-option:hover {
          border-color: #CD853F;
          background: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(205, 133, 63, 0.15);
        }

        .event-option.selected, .time-slot-option.selected, .travel-option.selected, .style-option.selected {
          border-color: #CD853F;
          background: #fff8f0;
        }

        .event-emoji, .travel-icon, .time-icon {
          font-size: 1.5rem;
        }

        .checkmark {
          position: absolute;
          right: 16px;
          color: #CD853F;
          font-weight: bold;
          font-size: 1.2rem;
        }

        .budget-input-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .budget-input {
          display: flex;
          align-items: center;
          border: 1px solid #e0d5c9;
          border-radius: 10px;
          padding: 8px 16px;
          background: #faf8f5;
        }

        .budget-input:focus-within {
          border-color: #CD853F;
          background: white;
          box-shadow: 0 0 0 3px rgba(205, 133, 63, 0.1);
        }

        .currency {
          font-weight: 600;
          color: #8B4513;
          margin-right: 8px;
        }

        .budget-field {
          border: none;
          background: transparent;
          font-size: 1rem;
          flex: 1;
          outline: none;
        }

        .budget-preset-buttons {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }

        .budget-preset {
          padding: 10px 20px;
          border: 2px solid #e0d5c9;
          border-radius: 8px;
          background: #faf8f5;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 0.95rem;
          font-weight: 500;
          color: #8B4513;
        }

        .budget-preset:hover {
          border-color: #CD853F;
          background: white;
        }

        .budget-preset.selected {
          background: #CD853F;
          color: white;
          border-color: #CD853F;
        }

        .number-selector {
          display: flex;
          align-items: center;
          gap: 1rem;
          border: 1px solid #e0d5c9;
          border-radius: 10px;
          background: #faf8f5;
          padding: 8px;
          width: fit-content;
        }

        .number-btn {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 8px;
          background: white;
          font-size: 1.3rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s;
          color: #8B4513;
        }

        .number-btn:hover {
          background: #CD853F;
          color: white;
          transform: scale(1.1);
        }

        .number-display {
          font-size: 1.2rem;
          font-weight: 600;
          min-width: 40px;
          text-align: center;
        }

        .form-navigation {
          display: flex;
          justify-content: space-between;
          margin-top: 2.5rem;
          gap: 1rem;
        }

        .btn-primary, .btn-secondary {
          padding: 14px 32px;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          border: none;
        }

        .btn-primary {
          background: linear-gradient(135deg, #CD853F 0%, #D2691E 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(205, 133, 63, 0.3);
        }

        .btn-secondary {
          background: #faf8f5;
          color: #8B4513;
          border: 2px solid #e0d5c9;
        }

        .btn-secondary:hover {
          background: white;
          border-color: #CD853F;
        }

        .btn-primary:disabled, .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .upload-button:hover {
          background: #fff8f0;
          border-color: #D2691E;
          transform: translateY(-2px);
        }

        .upload-button:active {
          transform: translateY(0);
        }

        @media (max-width: 768px) {
          .booking-form-container {
            padding: 1.5rem;
          }

          .event-option-grid, .time-slot-grid, .travel-option-grid {
            grid-template-columns: 1fr;
          }

          .budget-input-row {
            grid-template-columns: 1fr;
          }

          .form-navigation {
            flex-direction: column;
          }

          .btn-primary, .btn-secondary {
            width: 100%;
          }

          .progress-step-container {
            display: none;
          }
        }
      `}</style>
      
      {/* Get Location Modal */}
      <GetLocationModal 
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSelect={handleLocationSelect}
      />
    </>
  );
};

export default BookingForm; 
