import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import GetLocationModal from './modals/GetLocationModal';
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
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [uploadingInspiration, setUploadingInspiration] = useState(false);
    const [linkInput, setLinkInput] = useState('');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        eventDate: '',
        eventType: '',
        otherEventType: '',
        preferredTimeSlot: '',
        location: '',
        latitude: '',
        longitude: '',
        artistTravelsToClient: 'both',
        venueName: '',
        minimumBudget: '',
        maximumBudget: '',
        duration: '3',
        numberOfPeople: '1',
        designStyle: '',
        coveragePreference: '',
        designInspiration: [],
        additionalRequests: ''
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

                // Convert eventType array to single value
                const eventTypeValue = Array.isArray(bookingData.eventType) 
                    ? bookingData.eventType[0] 
                    : bookingData.eventType || '';
                
                // Convert preferredTimeSlot array to single value
                const timeSlotValue = Array.isArray(bookingData.preferredTimeSlot)
                    ? bookingData.preferredTimeSlot[0]
                    : bookingData.preferredTimeSlot || '';
                
                // Handle travel preference
                let travelPreference;
                if (bookingData.artistTravelsToClient === 'both' || bookingData.artistTravelsToClient === 'Both') {
                    travelPreference = 'both';
                } else if (bookingData.artistTravelsToClient === true || bookingData.artistTravelsToClient === 'yes') {
                    travelPreference = 'yes';
                } else {
                    travelPreference = 'no';
                }

                // Populate form with booking data
                setFormData({
                    firstName: bookingData.firstName || '',
                    lastName: bookingData.lastName || '',
                    email: bookingData.email || '',
                    eventDate: bookingData.eventDate ? bookingData.eventDate.split('T')[0] : '',
                    eventType: eventTypeValue,
                    otherEventType: bookingData.otherEventType || '',
                    preferredTimeSlot: timeSlotValue,
                    location: bookingData.location || '',
                    latitude: bookingData.latitude?.toString() || '',
                    longitude: bookingData.longitude?.toString() || '',
                    artistTravelsToClient: travelPreference,
                    venueName: bookingData.venueName || '',
                    minimumBudget: bookingData.minimumBudget || '',
                    maximumBudget: bookingData.maximumBudget || '',
                    duration: bookingData.duration || 3,
                    numberOfPeople: bookingData.numberOfPeople || 1,
                    designStyle: bookingData.designStyle || '',
                    coveragePreference: bookingData.coveragePreference || '',
                    designInspiration: Array.isArray(bookingData.designInspiration) ? bookingData.designInspiration : (bookingData.designInspiration ? [bookingData.designInspiration] : []),
                    additionalRequests: `Hi artists! My original artist cancelled. I'm looking for someone available on short notice. Please apply only if you're 100% available.`
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

        if (type === 'radio') {
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

    const handleInspirationImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        setUploadingInspiration(true);
        try {
            const uploadPromises = files.map(file => uploadToCloudinary(file));
            const urls = await Promise.all(uploadPromises);
            setFormData(prev => ({
                ...prev,
                designInspiration: [...(Array.isArray(prev.designInspiration) ? prev.designInspiration : []), ...urls]
            }));
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload images. Please try again.');
        } finally {
            setUploadingInspiration(false);
        }
    };

    const handleAddInspirationLink = () => {
        if (!linkInput.trim()) return;
        const url = linkInput.trim();
        setFormData(prev => ({
            ...prev,
            designInspiration: [...(Array.isArray(prev.designInspiration) ? prev.designInspiration : []), url]
        }));
        setLinkInput('');
    };

    const handleRemoveInspirationImage = (index) => {
        setFormData(prev => ({
            ...prev,
            designInspiration: Array.isArray(prev.designInspiration) ? prev.designInspiration.filter((_, i) => i !== index) : []
        }));
    };

    const handleLocationSelect = (lat, lng) => {
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
            .then(res => res.json())
            .then(data => {
                let locationName = '';
                const address = data.address || {};
                locationName = address.city || address.town || address.village || address.suburb || address.county || '';
                if (!locationName) {
                    locationName = address.postcode ? `Postcode ${address.postcode}` : '';
                }
                if (!locationName) {
                    locationName = data.display_name ? data.display_name.split(',').slice(0, 2).join(',') : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                }
                setFormData(prev => ({
                    ...prev,
                    location: locationName,
                    latitude: lat.toString(),
                    longitude: lng.toString()
                }));
                setShowLocationModal(false);
            })
            .catch(error => {
                console.error('Geocoding error:', error);
                setFormData(prev => ({
                    ...prev,
                    location: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                    latitude: lat.toString(),
                    longitude: lng.toString()
                }));
                setShowLocationModal(false);
            });
    };

    const handleSaveChanges = async () => {
        try {
            setLoading(true);

            // Convert data to match backend expectations
            const updateData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email || user?.email || '',
                eventDate: formData.eventDate,
                eventType: [formData.eventType],
                otherEventType: formData.otherEventType || undefined,
                preferredTimeSlot: [formData.preferredTimeSlot],
                location: formData.location,
                latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
                longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
                artistTravelsToClient: formData.artistTravelsToClient === 'both' ? 'both' : formData.artistTravelsToClient === 'yes',
                venueName: formData.venueName || undefined,
                minimumBudget: Number(formData.minimumBudget),
                maximumBudget: Number(formData.maximumBudget),
                duration: Number(formData.duration) || 3,
                numberOfPeople: Number(formData.numberOfPeople),
                designStyle: formData.designStyle,
                designInspiration: Array.isArray(formData.designInspiration) ? formData.designInspiration : [],
                coveragePreference: formData.coveragePreference || undefined,
                additionalRequests: formData.additionalRequests || undefined
            };

            const response = await bookingsAPI.updateBooking(bookingId, updateData);

            if (response.success) {
                alert('Booking updated successfully!');
                setShowModal(false);
                navigate('/dashboard/bookings');
            } else {
                setError(response.message || 'Failed to update booking');
            }
        } catch (error) {
            console.error('Error updating booking:', error);
            setError(error.message || 'Failed to update booking. Please try again.');
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
            setError(error.message || 'Failed to process refund. Please try again.');
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
                <div className="modal-overlay" onClick={handleCloseModal} style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{
                        maxWidth: '800px',
                        maxHeight: '90vh',
                        width: '95%',
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '2rem 2.5rem 1.5rem',
                            borderBottom: '1px solid #e8ddd4',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h2 style={{ 
                                margin: 0, 
                                fontSize: '1.75rem', 
                                fontWeight: '600', 
                                color: '#8B4513' 
                            }}>Edit Booking</h2>
                            <button onClick={handleCloseModal} style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '28px',
                                color: '#8B4513',
                                cursor: 'pointer',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>×</button>
                        </div>

                        {/* Modal Body */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '2rem 2.5rem'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {/* Event Type */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>Event Type *</label>
                                    <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1rem' }}>Choose the event you are booking for</p>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                        gap: '1rem'
                                    }}>
                                        {[
                                            { value: 'Wedding', emoji: '💍' },
                                            { value: 'Eid', emoji: '🌙' },
                                            { value: 'Party', emoji: '🎉' },
                                            { value: 'Festival', emoji: '🎊' }
                                        ].map(opt => (
                                            <label key={opt.value} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '16px',
                                                border: `2px solid ${formData.eventType === opt.value ? '#CD853F' : '#e0d5c9'}`,
                                                borderRadius: '12px',
                                                background: formData.eventType === opt.value ? '#fff8f0' : '#faf8f5',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s',
                                                position: 'relative'
                                            }} onClick={() => setFormData(prev => ({ ...prev, eventType: opt.value }))}>
                                        <input
                                                    type="radio"
                                                    name="eventType"
                                                    value={opt.value}
                                                    checked={formData.eventType === opt.value}
                                            onChange={handleInputChange}
                                                    style={{ display: 'none' }}
                                                />
                                                <span style={{ fontSize: '1.5rem' }}>{opt.emoji}</span>
                                                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{opt.value}</span>
                                                {formData.eventType === opt.value && (
                                                    <span style={{ position: 'absolute', right: '16px', color: '#CD853F', fontWeight: 'bold', fontSize: '1.3rem' }}>✓</span>
                                                )}
                                    </label>
                                        ))}
                            </div>
                                    <input
                                        name="otherEventType"
                                        placeholder="Other:"
                                        value={formData.otherEventType || ''}
                                        onChange={handleInputChange}
                                        style={{
                                            padding: '12px 16px',
                                            border: '1px solid #e0d5c9',
                                            borderRadius: '10px',
                                            fontSize: '1rem',
                                            background: '#faf8f5',
                                            width: '100%',
                                            marginTop: '1rem',
                                            outline: 'none',
                                            transition: 'all 0.3s'
                                        }}
                                    />
                                </div>

                                {/* Event Date */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>Event Date *</label>
                                    <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '0.5rem' }}>Select the date of your occasion</p>
                                    <input name="eventDate" type="date" value={formData.eventDate || ''} onChange={handleInputChange} style={{
                                        padding: '12px 16px',
                                        border: '1px solid #e0d5c9',
                                        borderRadius: '10px',
                                        fontSize: '1rem',
                                        background: '#faf8f5',
                                        width: '100%',
                                        outline: 'none',
                                        transition: 'all 0.3s'
                                    }} />
                                </div>

                                {/* Preferred Time Slot */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>Preferred Time Slot *</label>
                                    <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1rem' }}>Pick one option</p>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                        gap: '1rem'
                                    }}>
                                        {[
                                            { value: 'Morning', icon: '☀️' },
                                            { value: 'Afternoon', icon: '🌤️' },
                                            { value: 'Evening', icon: '🌙' },
                                            { value: 'Flexible', icon: '🔄' }
                                        ].map(opt => (
                                            <label key={opt.value} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '16px',
                                                border: `2px solid ${formData.preferredTimeSlot === opt.value ? '#CD853F' : '#e0d5c9'}`,
                                                borderRadius: '12px',
                                                background: formData.preferredTimeSlot === opt.value ? '#fff8f0' : '#faf8f5',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s',
                                                position: 'relative'
                                            }} onClick={() => setFormData(prev => ({ ...prev, preferredTimeSlot: opt.value }))}>
                                            <input
                                                    type="radio"
                                                    name="preferredTimeSlot"
                                                    value={opt.value}
                                                    checked={formData.preferredTimeSlot === opt.value}
                                                onChange={handleInputChange}
                                                    style={{ display: 'none' }}
                                                />
                                                <span style={{ fontSize: '1.5rem' }}>{opt.icon}</span>
                                                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{opt.value}</span>
                                                {formData.preferredTimeSlot === opt.value && (
                                                    <span style={{ position: 'absolute', right: '16px', color: '#CD853F', fontWeight: 'bold', fontSize: '1.3rem' }}>✓</span>
                                                )}
                                        </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Location */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>Location / Postcode *</label>
                                    <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1rem' }}>Click "Get Location" to select your location on the map</p>
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
                                <div>
                                    <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>Do you want the artist to come to you? *</label>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                        gap: '1rem'
                                    }}>
                                        {[
                                            { value: 'yes', text: 'Yes, come to my home', icon: '🚗' },
                                            { value: 'no', text: 'No, I\'ll travel to the artist', icon: '🏡' },
                                            { value: 'both', text: 'I\'m open to both', icon: '🤝' }
                                        ].map(opt => (
                                            <label key={opt.value} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '16px',
                                                border: `2px solid ${formData.artistTravelsToClient === opt.value ? '#CD853F' : '#e0d5c9'}`,
                                                borderRadius: '12px',
                                                background: formData.artistTravelsToClient === opt.value ? '#fff8f0' : '#faf8f5',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s',
                                                position: 'relative'
                                            }} onClick={() => setFormData(prev => ({ ...prev, artistTravelsToClient: opt.value }))}>
                                                <input type="radio" name="artistTravelsToClient" checked={formData.artistTravelsToClient === opt.value} onChange={() => setFormData(prev => ({ ...prev, artistTravelsToClient: opt.value }))} style={{ display: 'none' }} />
                                                <span style={{ fontSize: '1.5rem' }}>{opt.icon}</span>
                                                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{opt.text}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Venue Name */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>Venue Name</label>
                                    <input name="venueName" value={formData.venueName || ''} onChange={handleInputChange} placeholder="Enter venue name (optional)" style={{
                                        padding: '12px 16px',
                                        border: '1px solid #e0d5c9',
                                        borderRadius: '10px',
                                        fontSize: '1rem',
                                        background: '#faf8f5',
                                        width: '100%',
                                        outline: 'none',
                                        transition: 'all 0.3s'
                                    }} />
                                </div>

                                {/* Design Style */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>Style You're Looking For *</label>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                        gap: '1rem'
                                    }}>
                                        {['Bridal Mehndi', 'Party Mehndi', 'Festival Mehndi', 'Casual / Minimal Mehndi'].map(opt => (
                                            <label key={opt} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '16px',
                                                border: `2px solid ${formData.designStyle === opt ? '#CD853F' : '#e0d5c9'}`,
                                                borderRadius: '12px',
                                                background: formData.designStyle === opt ? '#fff8f0' : '#faf8f5',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s',
                                                position: 'relative'
                                            }} onClick={() => setFormData(prev => ({ ...prev, designStyle: opt }))}>
                                    <input
                                                    type="radio"
                                                    name="designStyle"
                                                    value={opt}
                                                    checked={formData.designStyle === opt}
                                        onChange={handleInputChange}
                                                    style={{ display: 'none' }}
                                                />
                                                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{opt}</span>
                                                {formData.designStyle === opt && (
                                                    <span style={{ position: 'absolute', right: '16px', color: '#CD853F', fontWeight: 'bold', fontSize: '1.3rem' }}>✓</span>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Design Inspiration */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>Design Inspiration</label>
                                    <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1rem' }}>Upload images or paste links to share your preferred designs</p>
                                    
                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                        <label style={{
                                            flex: 1,
                                            padding: '14px 20px',
                                            border: '2px solid #CD853F',
                                            borderRadius: '12px',
                                            background: '#fff8f0',
                                            color: '#8B4513',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            transition: 'all 0.3s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}>
                                            <span>📷</span>
                                            <span>Upload Images</span>
                                    <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handleInspirationImageUpload}
                                                disabled={uploadingInspiration}
                                                style={{ display: 'none' }}
                                            />
                                        </label>
                                </div>

                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <input
                                            type="text"
                                            placeholder="Paste image link here"
                                            value={linkInput}
                                            onChange={(e) => setLinkInput(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleAddInspirationLink();
                                                }
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '12px 16px',
                                                border: '1px solid #e0d5c9',
                                                borderRadius: '10px',
                                                fontSize: '1rem',
                                                background: '#faf8f5',
                                                outline: 'none'
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddInspirationLink}
                                            disabled={!linkInput.trim()}
                                            style={{
                                                padding: '12px 24px',
                                                border: 'none',
                                                borderRadius: '10px',
                                                background: linkInput.trim() ? '#CD853F' : '#e0d5c9',
                                                color: 'white',
                                                fontWeight: '600',
                                                cursor: linkInput.trim() ? 'pointer' : 'not-allowed',
                                                transition: 'all 0.3s'
                                            }}
                                        >
                                            Add Link
                                        </button>
                                </div>

                                    {Array.isArray(formData.designInspiration) && formData.designInspiration.length > 0 && (
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                            gap: '1rem',
                                            marginTop: '1rem'
                                        }}>
                                            {formData.designInspiration.map((url, idx) => (
                                                <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: '10px', overflow: 'hidden', border: '2px solid #e0d5c9' }}>
                                                    <img src={url} alt={`Inspiration ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveInspirationImage(idx)}
                                                        style={{
                                                            position: 'absolute',
                                                            top: '8px',
                                                            right: '8px',
                                                            width: '28px',
                                                            height: '28px',
                                                            borderRadius: '50%',
                                                            border: 'none',
                                                            background: 'rgba(255, 255, 255, 0.9)',
                                                            color: '#8B4513',
                                                            fontWeight: 'bold',
                                                            fontSize: '1.2rem',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                                            transition: 'all 0.3s'
                                                        }}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                </div>
                                    )}
                                </div>

                                {/* Coverage Preference */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>Coverage Preference (for bridal)</label>
                                    <select name="coveragePreference" value={formData.coveragePreference || ''} onChange={handleInputChange} style={{
                                        padding: '12px 16px',
                                        border: '1px solid #e0d5c9',
                                        borderRadius: '10px',
                                        fontSize: '1rem',
                                        background: '#faf8f5',
                                        width: '100%',
                                        outline: 'none',
                                        transition: 'all 0.3s'
                                    }}>
                                        <option value="">Select coverage</option>
                                        <option value="Full arms & feet">Full arms & feet</option>
                                        <option value="Hands only">Hands only</option>
                                        <option value="Simple, elegant design">Simple, elegant design</option>
                                        <option value="Not sure yet">Not sure yet</option>
                                    </select>
                                </div>

                                {/* Budget Range */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>What's your budget range? *</label>
                                    <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1rem' }}>Helps artists tailor their offers to you.</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e0d5c9', borderRadius: '10px', padding: '8px 16px', background: '#faf8f5' }}>
                                            <span style={{ fontWeight: '600', color: '#8B4513', marginRight: '8px' }}>£</span>
                                            <input name="minimumBudget" type="number" value={formData.minimumBudget || ''} onChange={handleInputChange} placeholder="From" style={{
                                                border: 'none',
                                                background: 'transparent',
                                                fontSize: '1rem',
                                                flex: 1,
                                                outline: 'none'
                                            }} />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e0d5c9', borderRadius: '10px', padding: '8px 16px', background: '#faf8f5' }}>
                                            <span style={{ fontWeight: '600', color: '#8B4513', marginRight: '8px' }}>£</span>
                                            <input name="maximumBudget" type="number" value={formData.maximumBudget || ''} onChange={handleInputChange} placeholder="To" style={{
                                                border: 'none',
                                                background: 'transparent',
                                                fontSize: '1rem',
                                                flex: 1,
                                                outline: 'none'
                                            }} />
                                        </div>
                                </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                        {[
                                            { from: 50, to: 100, label: 'Under £100' },
                                            { from: 100, to: 250, label: '£100 - £250' },
                                            { from: 250, to: 500, label: '£250 - £500' },
                                            { from: 500, to: 1000, label: '£500+' }
                                        ].map(preset => (
                                            <button type="button" key={preset.label} onClick={() => setFormData(prev => ({ ...prev, minimumBudget: preset.from, maximumBudget: preset.to }))} style={{
                                                padding: '10px 20px',
                                                border: `2px solid ${formData.minimumBudget == preset.from && formData.maximumBudget == preset.to ? '#CD853F' : '#e0d5c9'}`,
                                                borderRadius: '8px',
                                                background: formData.minimumBudget == preset.from && formData.maximumBudget == preset.to ? '#CD853F' : '#faf8f5',
                                                color: formData.minimumBudget == preset.from && formData.maximumBudget == preset.to ? 'white' : '#8B4513',
                                                fontWeight: '500',
                                                fontSize: '0.95rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s'
                                            }}>{preset.label}</button>
                                        ))}
                                </div>
                                    <p style={{ fontSize: '0.85rem', color: '#888' }}>
                                        Final price may vary depending on design, travel, and number of people.
                                    </p>
                                </div>

                                {/* Number of People */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>How many people need Mehndi? (for group bookings) *</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid #e0d5c9', borderRadius: '10px', background: '#faf8f5', padding: '8px', width: 'fit-content' }}>
                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, numberOfPeople: Math.max(1, (prev.numberOfPeople || 1) - 1) }))} style={{
                                            width: '40px', height: '40px', border: 'none', borderRadius: '8px', background: 'white', fontSize: '1.3rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s', color: '#8B4513'
                                        }}>-</button>
                                        <span style={{ fontSize: '1.2rem', fontWeight: '600', minWidth: '40px', textAlign: 'center' }}>{formData.numberOfPeople || 1}</span>
                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, numberOfPeople: (prev.numberOfPeople || 1) + 1 }))} style={{
                                            width: '40px', height: '40px', border: 'none', borderRadius: '8px', background: 'white', fontSize: '1.3rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s', color: '#8B4513'
                                        }}>+</button>
                                </div>
                                </div>

                                {/* Additional Requests */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>Anything else artists should know?</label>
                                    <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.5rem' }}>
                                        E.g. "Please bring your own cones," "We'll be outdoors," "Prefer traditional Indian patterns," or "I'm flexible with timing"
                                    </p>
                                    <textarea name="additionalRequests" rows="4" value={formData.additionalRequests || ''} onChange={handleInputChange} placeholder="Write your notes here..." style={{
                                        padding: '12px 16px',
                                        border: '1px solid #e0d5c9',
                                        borderRadius: '10px',
                                        fontSize: '1rem',
                                        background: '#faf8f5',
                                        width: '100%',
                                        outline: 'none',
                                        resize: 'vertical',
                                        fontFamily: 'inherit',
                                        transition: 'all 0.3s'
                                    }} />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            flexShrink: 0,
                            borderTop: '1px solid #e8ddd4',
                            padding: '1.5rem 2.5rem',
                            display: 'flex',
                            gap: '1rem',
                            justifyContent: 'flex-end',
                            background: '#faf8f5'
                        }}>
                            <button onClick={handleCloseModal} disabled={loading} style={{
                                padding: '14px 32px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                color: '#8B4513',
                                backgroundColor: 'white',
                                border: '2px solid #CD853F',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}>Cancel</button>
                            <button onClick={handleSaveChanges} disabled={loading} style={{
                                padding: '14px 32px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                color: 'white',
                                backgroundColor: '#CD853F',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1,
                                transition: 'all 0.3s',
                                boxShadow: loading ? 'none' : '0 4px 12px rgba(205, 133, 63, 0.3)'
                            }}>{loading ? 'Saving...' : 'Save Changes'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Get Location Modal */}
            {showLocationModal && (
                <GetLocationModal
                    onClose={() => setShowLocationModal(false)}
                    onLocationSelect={handleLocationSelect}
                />
            )}
        </div>
    );
};

export default PaymentRescheduleBooking;
