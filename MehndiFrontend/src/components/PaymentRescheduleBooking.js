import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import './PaymentRescheduleBooking.css';

const { bookingsAPI } = apiService;

const PaymentRescheduleBooking = () => {
    const { bookingId, action, artistId, userId } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        eventDate: '',
        eventType: [],
        otherEventType: '',
        preferredTimeSlot: [],
        location: '',
        artistTravelsToClient: false,
        fullAddress: '',
        city: '',
        postalCode: '',
        venueName: '',
        minimumBudget: '',
        maximumBudget: '',
        duration: '',
        numberOfPeople: '',
        designStyle: '',
        designComplexity: '',
        bodyPartsToDecorate: [],
        coveragePreference: '',
        designInspiration: '',
        additionalRequests: '',
        hands: false,
        feet: false,
        arms: false,
        back: false
    });

    useEffect(() => {
        if (action==='relist') {
            fetchBookingDetails();
        }
        else if (action==='refund'){
            processRefund();
        }
    }, [bookingId]);

    const fetchBookingDetails = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await bookingsAPI.getBooking(bookingId);
            console.log('Booking details response:', response);

            if (response.success && response.data) {
                const bookingData = response.data;
                setBooking(bookingData);

                // Populate form with booking data
                setFormData({
                    firstName: bookingData.firstName || '',
                    lastName: bookingData.lastName || '',
                    email: bookingData.email || '',
                    phone: bookingData.phoneNumber || '',
                    eventDate: bookingData.eventDate ? bookingData.eventDate.split('T')[0] : '',
                    eventType: Array.isArray(bookingData.eventType) ? bookingData.eventType : [],
                    otherEventType: bookingData.otherEventType || '',
                    preferredTimeSlot: Array.isArray(bookingData.preferredTimeSlot) ? bookingData.preferredTimeSlot : [],
                    location: bookingData.location || '',
                    artistTravelsToClient: bookingData.artistTravelsToClient || false,
                    fullAddress: bookingData.fullAddress || '',
                    city: bookingData.city || '',
                    postalCode: bookingData.postalCode || '',
                    venueName: bookingData.venueName || '',
                    minimumBudget: bookingData.minimumBudget || '',
                    maximumBudget: bookingData.maximumBudget || '',
                    duration: bookingData.duration || '',
                    numberOfPeople: bookingData.numberOfPeople || '',
                    designStyle: bookingData.designStyle || '',
                    designComplexity: bookingData.designComplexity || '',
                    bodyPartsToDecorate: Array.isArray(bookingData.bodyPartsToDecorate) ? bookingData.bodyPartsToDecorate : [],
                    coveragePreference: bookingData.coveragePreference || '',
                    designInspiration: bookingData.designInspiration || '',
                    additionalRequests: `Hi artists! My original artist cancelled. I’m looking for someone available on short notice.Please apply only if you’re 100% available.`,
                    hands: bookingData.bodyPartsToDecorate?.includes('Hands') || false,
                    feet: bookingData.bodyPartsToDecorate?.includes('Feet') || false,
                    arms: bookingData.bodyPartsToDecorate?.includes('Arms') || false,
                    back: bookingData.bodyPartsToDecorate?.includes('Back') || false
                });

                // Show modal automatically when booking is loaded
                setShowModal(true);
            } else {
                setError('Booking not found');
            }
        } catch (error) {
            console.error('Error fetching booking details:', error);
            setError('Failed to load booking details. You are not authenticated user to access this booking.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
            if (name === 'hands' || name === 'feet' || name === 'arms' || name === 'back') {
                setFormData(prev => {
                    const newBodyParts = [...prev.bodyPartsToDecorate];
                    const partName = name.charAt(0).toUpperCase() + name.slice(1);

                    if (checked) {
                        if (!newBodyParts.includes(partName)) {
                            newBodyParts.push(partName);
                        }
                    } else {
                        const index = newBodyParts.indexOf(partName);
                        if (index > -1) {
                            newBodyParts.splice(index, 1);
                        }
                    }

                    return {
                        ...prev,
                        [name]: checked,
                        bodyPartsToDecorate: newBodyParts
                    };
                });
            } else if (name === 'artistTravelsToClient') {
                setFormData(prev => ({
                    ...prev,
                    [name]: checked
                }));
            } else {
                // Handle event type and time slot checkboxes
                if (name === 'eventType') {
                    setFormData(prev => ({
                        ...prev,
                        eventType: checked
                            ? [...prev.eventType, value]
                            : prev.eventType.filter(type => type !== value)
                    }));
                } else if (name === 'timeSlot') {
                    setFormData(prev => ({
                        ...prev,
                        preferredTimeSlot: checked
                            ? [...prev.preferredTimeSlot, value]
                            : prev.preferredTimeSlot.filter(slot => slot !== value)
                    }));
                }
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSaveChanges = async () => {
        try {
            setLoading(true);

            const updateData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phoneNumber: formData.phone,
                eventDate: formData.eventDate,
                eventType: formData.eventType,
                otherEventType: formData.otherEventType,
                preferredTimeSlot: formData.preferredTimeSlot,
                location: formData.location,
                artistTravelsToClient: formData.artistTravelsToClient,
                fullAddress: formData.fullAddress,
                city: formData.city,
                postalCode: formData.postalCode,
                venueName: formData.venueName,
                minimumBudget: Number(formData.minimumBudget) || 0,
                maximumBudget: Number(formData.maximumBudget) || 0,
                duration: Number(formData.duration) || 0,
                numberOfPeople: Number(formData.numberOfPeople) || 0,
                designStyle: formData.designStyle,
                designComplexity: formData.designComplexity,
                bodyPartsToDecorate: formData.bodyPartsToDecorate,
                coveragePreference: formData.coveragePreference,
                designInspiration: formData.designInspiration,
                additionalRequests: formData.additionalRequests
            };

            const response = await bookingsAPI.updateBooking(bookingId, updateData);

            if (response.success) {
                alert('Booking updated successfully!');
                setShowModal(false);
                // Optionally navigate back or refresh
                navigate('/dashboard/bookings');
            } else {
                setError('Failed to update booking');
            }
        } catch (error) {
            console.error('Error updating booking:', error);
            setError('Failed to update booking. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        navigate('/dashboard/bookings');
    };

    const processRefund = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await bookingsAPI.processRefund({
                bookingId,
                userId,
                artistId
            });

            if (response.success) {
                alert('Refund processed successfully!');
                navigate('/dashboard/wallet');
            } else {
                setError(response.message || 'Failed to process refund');
            }
        } catch (error) {
            console.error('Error processing refund:', error);
            setError('Failed to process refund. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !booking) {
        return (
            <div className="payment-reschedule-container">
                <div className="loading">Loading booking details...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="payment-reschedule-container">
                <div className="error">{error}</div>
                <button onClick={() => navigate('/dashboard/bookings')}>Go Back</button>
            </div>
        );
    }

    return (
        <div className="payment-reschedule-container">
            <div className="page-header">
                <h1>Payment Reschedule Booking</h1>
                <p>Booking ID: {bookingId}</p>
            </div>

            {/* Reschedule Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content reschedule-modal">
                        {/* Modal Header */}
                        <div className="modal-header">
                            <h2>Edit Booking</h2>
                            <button className="close-btn" onClick={handleCloseModal}>
                                <span>&times;</span>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="modal-body">
                            {/* Event Type Checkboxes */}
                            <div className="form-section">
                                <label className="section-label">Event type</label>
                                <div className="checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="wedding"
                                            value="Wedding"
                                            checked={formData.eventType.includes('Wedding')}
                                            onChange={handleInputChange}
                                        />
                                        Wedding
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="eid"
                                            value="Eid"
                                            checked={formData.eventType.includes('Eid')}
                                            onChange={handleInputChange}
                                        />
                                        Eid
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="party"
                                            value="Party"
                                            checked={formData.eventType.includes('Party')}
                                            onChange={handleInputChange}
                                        />
                                        Party
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="festival"
                                            value="Festival"
                                            checked={formData.eventType.includes('Festival')}
                                            onChange={handleInputChange}
                                        />
                                        Festival
                                    </label>
                                </div>
                            </div>

                            {/* Coverage Checkboxes */}
                            <div className="form-section">
                                <label className="section-label">Coverage</label>
                                <div className="checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="hands"
                                            checked={formData.hands}
                                            onChange={handleInputChange}
                                        />
                                        Hands
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="feet"
                                            checked={formData.feet}
                                            onChange={handleInputChange}
                                        />
                                        Feet
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="arms"
                                            checked={formData.arms}
                                            onChange={handleInputChange}
                                        />
                                        Arms
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="back"
                                            checked={formData.back}
                                            onChange={handleInputChange}
                                        />
                                        Back
                                    </label>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>First name</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Last name</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Phone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Event date</label>
                                    <input
                                        type="date"
                                        name="eventDate"
                                        value={formData.eventDate}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Other event type</label>
                                    <input
                                        type="text"
                                        name="otherEventType"
                                        value={formData.otherEventType}
                                        onChange={handleInputChange}
                                        placeholder="Enter other event type"
                                    />
                                </div>

                                {/* Preferred Time Slot */}
                                <div className="form-section">
                                    <label className="section-label">Preferred Time Slot</label>
                                    <div className="checkbox-group">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                name="timeSlot"
                                                value="Morning"
                                                checked={formData.preferredTimeSlot.includes('Morning')}
                                                onChange={handleInputChange}
                                            />
                                            Morning
                                        </label>
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                name="timeSlot"
                                                value="Afternoon"
                                                checked={formData.preferredTimeSlot.includes('Afternoon')}
                                                onChange={handleInputChange}
                                            />
                                            Afternoon
                                        </label>
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                name="timeSlot"
                                                value="Evening"
                                                checked={formData.preferredTimeSlot.includes('Evening')}
                                                onChange={handleInputChange}
                                            />
                                            Evening
                                        </label>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Location</label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        placeholder="Enter location"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        placeholder="Enter city"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Full Address</label>
                                    <input
                                        type="text"
                                        name="fullAddress"
                                        value={formData.fullAddress}
                                        onChange={handleInputChange}
                                        placeholder="Enter full address"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Postal Code</label>
                                    <input
                                        type="text"
                                        name="postalCode"
                                        value={formData.postalCode}
                                        onChange={handleInputChange}
                                        placeholder="Enter postal code"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Minimum Budget (£)</label>
                                    <input
                                        type="number"
                                        name="minimumBudget"
                                        value={formData.minimumBudget}
                                        onChange={handleInputChange}
                                        placeholder="Enter minimum budget"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Maximum Budget (£)</label>
                                    <input
                                        type="number"
                                        name="maximumBudget"
                                        value={formData.maximumBudget}
                                        onChange={handleInputChange}
                                        placeholder="Enter maximum budget"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Duration (hours)</label>
                                    <input
                                        type="number"
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleInputChange}
                                        placeholder="Enter duration"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Number of People</label>
                                    <input
                                        type="number"
                                        name="numberOfPeople"
                                        value={formData.numberOfPeople}
                                        onChange={handleInputChange}
                                        placeholder="Enter number of people"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Design Style</label>
                                    <select
                                        name="designStyle"
                                        value={formData.designStyle}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select design style</option>
                                        <option value="Traditional">Traditional</option>
                                        <option value="Modern">Modern</option>
                                        <option value="Contemporary">Contemporary</option>
                                        <option value="Fusion">Fusion</option>
                                        <option value="Custom">Custom</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Design Complexity</label>
                                    <select
                                        name="designComplexity"
                                        value={formData.designComplexity}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select complexity</option>
                                        <option value="Simple">Simple</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Very High">Very High</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="artistTravelsToClient"
                                            checked={formData.artistTravelsToClient}
                                            onChange={handleInputChange}
                                        />
                                        Artist travels to client location
                                    </label>
                                </div>

                                <div className="form-group full-width">
                                    <label>Venue name</label>
                                    <input
                                        type="text"
                                        name="venueName"
                                        value={formData.venueName}
                                        onChange={handleInputChange}
                                        placeholder="Enter venue name"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Coverage preference</label>
                                    <select
                                        name="coveragePreference"
                                        value={formData.coveragePreference}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select coverage</option>
                                        <option value="minimal">Minimal</option>
                                        <option value="moderate">Moderate</option>
                                        <option value="extensive">Extensive</option>
                                        <option value="full">Full Coverage</option>
                                    </select>
                                </div>

                                <div className="form-group full-width">
                                    <label>Design inspiration</label>
                                    <textarea
                                        name="designInspiration"
                                        value={formData.designInspiration}
                                        onChange={handleInputChange}
                                        rows="3"
                                        placeholder="Describe your design inspiration..."
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Additional requests</label>
                                    <textarea
                                        name="additionalRequests"
                                        value={formData.additionalRequests}
                                        onChange={handleInputChange}
                                        rows="3"
                                        placeholder="Any additional requests or special requirements..."
                                    />
                                </div>
                            </div>

                            {error && <div className="error-message">{error}</div>}
                        </div>

                        {/* Modal Footer */}
                        <div className="modal-footer">
                            <button className="btn btn-cancel" onClick={handleCloseModal}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-save"
                                onClick={handleSaveChanges}
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentRescheduleBooking;
