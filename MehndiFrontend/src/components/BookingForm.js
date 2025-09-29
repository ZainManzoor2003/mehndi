import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import apiService from '../services/api';

const { bookingsAPI } = apiService;

const BookingForm = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    // Contact Details
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    
    // Event Details
    eventType: [],
    otherEventType: '',
    eventDate: '',
    preferredTimeSlot: [],
    location: '',
    artistTravelsToClient: '',
    duration: '',
    numberOfPeople: '',
    
    // Style Details
    designStyle: '',
    designComplexity: '',
    bodyPartsToDecorate: [],
    designInspiration: '',
    
    // Budget
    minimumBudget: '',
    maximumBudget: '',
    
    // Additional Info
    additionalRequests: '',
    venueName: '',
    coveragePreference: '',
    fullAddress: '',
    city: '',
    postalCode: ''
  });

  const steps = [
    { id: 1, name: 'Contact' },
    { id: 2, name: 'Event' },
    { id: 3, name: 'Style' },
    { id: 4, name: 'Budget' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'eventType' || name === 'preferredTimeSlot' || name === 'bodyPartsToDecorate') {
        setFormData(prev => ({
          ...prev,
          [name]: checked 
            ? [...prev[name], value]
            : prev[name].filter(item => item !== value)
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: checked
        }));
      }
    } else if (type === 'radio') {
      setFormData(prev => ({
        ...prev,
        [name]: value === 'yes'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleNextStep = () => {
    if (currentStep < 5) {
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

    console.log('Form submission started...');
    console.log('Current form data:', formData);
    console.log('Is authenticated:', isAuthenticated);

    // Check if user is authenticated
    if (!isAuthenticated) {
      setError('Please log in to submit a booking request');
      return;
    }

    // Validate required fields - more flexible validation
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phoneNumber',
      'eventType', 'eventDate', 'minimumBudget', 'maximumBudget'
    ];

    // Check which fields are missing
    const missingFields = [];
    for (const field of requiredFields) {
      if (!formData[field] || (Array.isArray(formData[field]) && formData[field].length === 0)) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      
      // Navigate to the step with missing fields
      if (missingFields.some(field => ['firstName', 'lastName', 'email', 'phoneNumber'].includes(field))) {
        setCurrentStep(1);
        setError('Please complete the Contact Details in Step 1');
      } else if (missingFields.some(field => ['eventType', 'eventDate'].includes(field))) {
        setCurrentStep(2);
        setError('Please complete the Event Details in Step 2');
      } else if (missingFields.some(field => ['minimumBudget', 'maximumBudget'].includes(field))) {
        setCurrentStep(4);
        setError('Please complete the Budget information in Step 4');
      } else {
        setError(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      }
      return;
    }

    if (parseInt(formData.maximumBudget) <= parseInt(formData.minimumBudget)) {
      setError('Maximum budget must be greater than minimum budget');
      return;
    }

    // Check if event date is in the future
    const eventDate = new Date(formData.eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today
    
    if (eventDate <= today) {
      setCurrentStep(2);
      setError('Event date must be in the future. Please select a date after today.');
      return;
    }

    setIsLoading(true);

    try {
      // Transform form data to match booking schema
      const bookingData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        eventType: formData.eventType,
        otherEventType: formData.otherEventType || undefined,
        eventDate: formData.eventDate,
        preferredTimeSlot: formData.preferredTimeSlot,
        location: formData.location,
        artistTravelsToClient: formData.artistTravelsToClient,
        fullAddress: formData.fullAddress,
        city: formData.city,
        postalCode: formData.postalCode,
        venueName: formData.venueName || undefined,
        minimumBudget: parseInt(formData.minimumBudget),
        maximumBudget: parseInt(formData.maximumBudget),
        duration: parseInt(formData.duration) || 3,
        numberOfPeople: parseInt(formData.numberOfPeople) || 1,
        designStyle: formData.designStyle,
        designComplexity: formData.designComplexity,
        bodyPartsToDecorate: formData.bodyPartsToDecorate,
        designInspiration: formData.designInspiration || undefined,
        coveragePreference: formData.coveragePreference || undefined,
        additionalRequests: formData.additionalRequests || undefined
      };

      console.log('Submitting booking data:', bookingData);
      console.log('Booking data JSON:', JSON.stringify(bookingData, null, 2));

      const response = await bookingsAPI.createBooking(bookingData);
      
      console.log('Booking created successfully:', response);
      setSuccess('Your booking request has been submitted successfully! Artists will be able to view and respond to your request.');
      
      // Clear form
      setFormData({
        firstName: '', lastName: '', email: '', phoneNumber: '',
        eventType: [], otherEventType: '', eventDate: '', preferredTimeSlot: [],
        location: '', artistTravelsToClient: '', duration: '', numberOfPeople: '',
        designStyle: '', designComplexity: '', bodyPartsToDecorate: [], designInspiration: '',
        minimumBudget: '', maximumBudget: '', additionalRequests: '', venueName: '',
        coveragePreference: '', fullAddress: '', city: '', postalCode: ''
      });
      
      // Reset to first step
      setCurrentStep(1);
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);

    } catch (error) {
      console.error('Booking creation error:', error);
      
      // If it's a validation error, show more specific information
      if (error.message.includes('Validation errors')) {
        setError('Please check all required fields. Make sure budget amounts are filled in correctly.');
      } else {
        setError(error.message || 'Failed to submit booking request. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <>
      <Header />
      <div className="booking-container">

        <div className="booking-form-container">
          {/* Progress Bar */}
          <div className="progress-bar">
            {steps.map((step, index) => (
              <div key={step.id} className="progress-step-container">
                <div 
                  className={`progress-step ${currentStep >= step.id ? 'active' : ''} ${currentStep === step.id ? 'current' : ''}`}
                >
                  <span className="step-number">{step.id}</span>
                  <span className="step-name">{step.name}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`progress-line ${currentStep > step.id ? 'completed' : ''}`}></div>
                )}
              </div>
            ))}
          </div>

          <form className="booking-form" onSubmit={handleSubmit}>
            {/* Step 1: Contact Details */}
            {currentStep === 1 && (
              <div className="form-step">
                <div className="step-header">
                  <h2 className="step-title">Contact Details</h2>
                  <p className="step-subtitle">We need your contact information to get started</p>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      className="form-input"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      className="form-input"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      className="form-input"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
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

                <div className="form-group">
                  <label className="form-label">Event Type *</label>
                  <div className="checkbox-grid">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="eventType"
                        value="Wedding"
                        checked={formData.eventType.includes('Wedding')}
                        onChange={handleInputChange}
                        className="checkbox-input"
                      />
                      <span className="checkbox-text">Wedding</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="eventType"
                        value="Eid"
                        checked={formData.eventType.includes('Eid')}
                        onChange={handleInputChange}
                        className="checkbox-input"
                      />
                      <span className="checkbox-text">Eid</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="eventType"
                        value="Party"
                        checked={formData.eventType.includes('Party')}
                        onChange={handleInputChange}
                        className="checkbox-input"
                      />
                      <span className="checkbox-text">Party</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="eventType"
                        value="Festival"
                        checked={formData.eventType.includes('Festival')}
                        onChange={handleInputChange}
                        className="checkbox-input"
                      />
                      <span className="checkbox-text">Festival</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    name="otherEventType"
                    className="form-input"
                    placeholder="Other:"
                    value={formData.otherEventType}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Event Date *</label>
                  <input
                    type="date"
                    name="eventDate"
                    className="form-input"
                    value={formData.eventDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Preferred Time Slot *</label>
                  <div className="checkbox-grid">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="preferredTimeSlot"
                        value="Morning"
                        checked={formData.preferredTimeSlot.includes('Morning')}
                        onChange={handleInputChange}
                        className="checkbox-input"
                      />
                      <span className="checkbox-text">Morning</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="preferredTimeSlot"
                        value="Afternoon"
                        checked={formData.preferredTimeSlot.includes('Afternoon')}
                        onChange={handleInputChange}
                        className="checkbox-input"
                      />
                      <span className="checkbox-text">Afternoon</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="preferredTimeSlot"
                        value="Evening"
                        checked={formData.preferredTimeSlot.includes('Evening')}
                        onChange={handleInputChange}
                        className="checkbox-input"
                      />
                      <span className="checkbox-text">Evening</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="preferredTimeSlot"
                        value="Flexible"
                        checked={formData.preferredTimeSlot.includes('Flexible')}
                        onChange={handleInputChange}
                        className="checkbox-input"
                      />
                      <span className="checkbox-text">Flexible</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Location / Postcode *</label>
                  <input
                    type="text"
                    name="location"
                    className="form-input"
                    placeholder="Enter your location or postcode"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Do you want the artist to come to you? *</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="artistTravelsToClient"
                        value="yes"
                        checked={formData.artistTravelsToClient === true}
                        onChange={handleInputChange}
                        className="radio-input"
                      />
                      <span className="radio-text">Yes, I'd like the artist to travel to my home</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="artistTravelsToClient"
                        value="no"
                        checked={formData.artistTravelsToClient === false}
                        onChange={handleInputChange}
                        className="radio-input"
                      />
                      <span className="radio-text">No, I can travel to the artist</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Style Details */}
            {currentStep === 3 && (
              <div className="form-step">
                <div className="step-header">
                  <h2 className="step-title">Style Preferences</h2>
                  <p className="step-subtitle">Help us understand your desired henna style</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Design Style *</label>
                  <select
                    name="designStyle"
                    className="form-input"
                    value={formData.designStyle}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a style</option>
                    <option value="Traditional">Traditional</option>
                    <option value="Modern">Modern</option>
                    <option value="Arabic">Arabic</option>
                    <option value="Indian">Indian</option>
                    <option value="Moroccan">Moroccan</option>
                    <option value="Minimalist">Minimalist</option>
                    <option value="Bridal">Bridal</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Design Complexity *</label>
                  <select
                    name="designComplexity"
                    className="form-input"
                    value={formData.designComplexity}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select complexity</option>
                    <option value="Simple">Simple</option>
                    <option value="Medium">Medium</option>
                    <option value="Complex">Complex</option>
                    <option value="Very Complex">Very Complex</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Body Parts to be decorated *</label>
                  <div className="checkbox-grid">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="bodyPartsToDecorate"
                        value="Hands"
                        checked={formData.bodyPartsToDecorate.includes('Hands')}
                        onChange={handleInputChange}
                        className="checkbox-input"
                      />
                      <span className="checkbox-text">Hands</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="bodyPartsToDecorate"
                        value="Feet"
                        checked={formData.bodyPartsToDecorate.includes('Feet')}
                        onChange={handleInputChange}
                        className="checkbox-input"
                      />
                      <span className="checkbox-text">Feet</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="bodyPartsToDecorate"
                        value="Arms"
                        checked={formData.bodyPartsToDecorate.includes('Arms')}
                        onChange={handleInputChange}
                        className="checkbox-input"
                      />
                      <span className="checkbox-text">Arms</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="bodyPartsToDecorate"
                        value="Back"
                        checked={formData.bodyPartsToDecorate.includes('Back')}
                        onChange={handleInputChange}
                        className="checkbox-input"
                      />
                      <span className="checkbox-text">Back</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Design Inspiration</label>
                  <textarea
                    name="designInspiration"
                    className="form-textarea"
                    placeholder="Describe your vision or any specific design elements you'd like..."
                    value={formData.designInspiration}
                    onChange={handleInputChange}
                    rows="4"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Budget */}
            {currentStep === 4 && (
              <div className="form-step">
                <div className="step-header">
                  <h2 className="step-title">Budget Range</h2>
                  <p className="step-subtitle">Help artists provide accurate quotes</p>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Minimum Budget (£) *</label>
                    <input
                      type="number"
                      name="minimumBudget"
                      className="form-input"
                      placeholder="50"
                      value={formData.minimumBudget}
                      onChange={handleInputChange}
                      min="50"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Maximum Budget (£) *</label>
                    <input
                      type="number"
                      name="maximumBudget"
                      className="form-input"
                      placeholder="500"
                      value={formData.maximumBudget}
                      onChange={handleInputChange}
                      min="50"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Duration (Hours) *</label>
                    <input
                      type="number"
                      name="duration"
                      className="form-input"
                      placeholder="3"
                      value={formData.duration}
                      onChange={handleInputChange}
                      min="1"
                      max="12"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Number of People *</label>
                    <input
                      type="number"
                      name="numberOfPeople"
                      className="form-input"
                      placeholder="5"
                      value={formData.numberOfPeople}
                      onChange={handleInputChange}
                      min="1"
                      max="50"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Full Address *</label>
                  <input
                    type="text"
                    name="fullAddress"
                    className="form-input"
                    placeholder="123 Main Street"
                    value={formData.fullAddress}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input
                      type="text"
                      name="city"
                      className="form-input"
                      placeholder="London"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Postal Code *</label>
                    <input
                      type="text"
                      name="postalCode"
                      className="form-input"
                      placeholder="SW1A 1AA"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Additional Requests</label>
                  <textarea
                    name="additionalRequests"
                    className="form-textarea"
                    placeholder="Any special requirements, allergies, or additional information..."
                    value={formData.additionalRequests}
                    onChange={handleInputChange}
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Venue Name (Optional)</label>
                  <input
                    type="text"
                    name="venueName"
                    className="form-input"
                    placeholder="Enter venue name if applicable"
                    value={formData.venueName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Coverage Preference (for bridal) (Optional)</label>
                  <select
                    name="coveragePreference"
                    className="form-input"
                    value={formData.coveragePreference}
                    onChange={handleInputChange}
                  >
                    <option value="">Select coverage</option>
                    <option value="Light">Light Coverage</option>
                    <option value="Medium">Medium Coverage</option>
                    <option value="Full">Full Coverage</option>
                    <option value="Bridal Package">Bridal Package</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="form-step">
                <div className="step-header">
                  <h2 className="step-title">Review Your Request</h2>
                  <p className="step-subtitle">Please review your details before submitting</p>
                </div>

                <div className="review-section">
                  <h3>Contact Information</h3>
                  <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                  <p><strong>Email:</strong> {formData.email}</p>
                  <p><strong>Phone:</strong> {formData.phoneNumber}</p>
                </div>

                <div className="review-section">
                  <h3>Event Details</h3>
                  <p><strong>Event Type:</strong> {formData.eventType.join(', ')} {formData.otherEventType}</p>
                  <p><strong>Date:</strong> {formData.eventDate}</p>
                  <p><strong>Time:</strong> {formData.preferredTimeSlot.join(', ')}</p>
                  <p><strong>Location:</strong> {formData.location}</p>
                  <p><strong>Artist Travel:</strong> {formData.artistTravelsToClient ? 'Yes' : 'No'}</p>
                </div>

                <div className="review-section">
                  <h3>Style Preferences</h3>
                  <p><strong>Style:</strong> {formData.designStyle}</p>
                  <p><strong>Complexity:</strong> {formData.designComplexity}</p>
                  <p><strong>Body Parts:</strong> {formData.bodyPartsToDecorate.join(', ')}</p>
                  {formData.designInspiration && <p><strong>Inspiration:</strong> {formData.designInspiration}</p>}
                </div>

                <div className="review-section">
                  <h3>Budget & Additional Info</h3>
                  <p><strong>Budget:</strong> £{formData.minimumBudget || 0} - £{formData.maximumBudget || 0}</p>
                  <p><strong>Duration:</strong> {formData.duration || 3} hours</p>
                  <p><strong>Number of People:</strong> {formData.numberOfPeople || 1}</p>
                  {formData.fullAddress && <p><strong>Address:</strong> {formData.fullAddress}</p>}
                  {formData.city && <p><strong>City:</strong> {formData.city}</p>}
                  {formData.postalCode && <p><strong>Postal Code:</strong> {formData.postalCode}</p>}
                  {formData.additionalRequests && <p><strong>Additional Requests:</strong> {formData.additionalRequests}</p>}
                  {formData.venueName && <p><strong>Venue:</strong> {formData.venueName}</p>}
                  {formData.coveragePreference && <p><strong>Coverage:</strong> {formData.coveragePreference}</p>}
                </div>
              </div>
            )}

            {/* Error and Success Messages */}
            {error && (
              <div className="error-message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {error}
              </div>
            )}
            
            {success && (
              <div className="success-message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
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
              
              {currentStep < 5 ? (
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
                  {isLoading ? (
                    <>
                      <svg className="loading-spinner" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="31.416" strokeDashoffset="31.416">
                          <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                          <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                        </circle>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default BookingForm; 