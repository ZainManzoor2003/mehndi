import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import DashboardSidebar from './DashboardSidebar';
import apiService from '../services/api';
import { FaCalendarAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import CancelAcceptedModal from './modals/CancelAcceptedModal';
import GetLocationModal from './modals/GetLocationModal';

const { bookingsAPI } = apiService;

const AllBookings = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({});
  const [linkInput, setLinkInput] = useState('');
  const [uploadingInspiration, setUploadingInspiration] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Handler for uploading design inspiration images
  const handleInspirationImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingInspiration(true);
    try {
      const uploadPromises = files.map(file => uploadToCloudinary(file));
      const urls = await Promise.all(uploadPromises);
      const currentImages = Array.isArray(form.designInspiration) ? form.designInspiration : [];
      setForm(prev => ({
        ...prev,
        designInspiration: [...currentImages, ...urls]
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
    const currentImages = Array.isArray(form.designInspiration) ? form.designInspiration : [];
    setForm(prev => ({
      ...prev,
      designInspiration: [...currentImages, linkInput.trim()]
    }));
    setLinkInput('');
  };

  const handleRemoveInspirationImage = (index) => {
    const currentImages = Array.isArray(form.designInspiration) ? form.designInspiration : [];
    const newImages = currentImages.filter((_, i) => i !== index);
    setForm(prev => ({
      ...prev,
      designInspiration: newImages
    }));
  };

  // Handler for location selection from modal
  const handleLocationSelect = (lat, lng) => {
    // Reverse geocode to get address from coordinates
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      .then(res => res.json())
      .then(data => {
        // Extract shorter location name (city, town, or suburb)
        let locationName = '';
        const address = data.address || {};
        
        // Prioritize: city > town > village > suburb > county
        locationName = address.city || 
                      address.town || 
                      address.village || 
                      address.suburb || 
                      address.county || 
                      '';
        
        // If we still don't have a location name, try to get postcode
        if (!locationName) {
          locationName = address.postcode ? `Postcode ${address.postcode}` : '';
        }
        
        // Final fallback
        if (!locationName) {
          locationName = data.display_name ? data.display_name.split(',').slice(0, 2).join(',') : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
        
        setForm(prev => ({
          ...prev,
          location: locationName,
          latitude: lat.toString(),
          longitude: lng.toString()
        }));
        setShowLocationModal(false);
      })
      .catch(error => {
        console.error('Geocoding error:', error);
        // Fallback to just coordinates
        setForm(prev => ({
          ...prev,
          location: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          latitude: lat.toString(),
          longitude: lng.toString()
        }));
        setShowLocationModal(false);
      });
  };

  // Sidebar handlers
  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const openEditModal = (booking) => {
    setEditing(booking);
    // Handle eventType - convert array to single value or take first value
    const eventTypeValue = Array.isArray(booking.eventType) 
      ? (booking.eventType.length === 1 ? booking.eventType[0] : booking.eventType[0]) 
      : booking.eventType || '';
    
    // Handle preferredTimeSlot - convert array to single value
    const timeSlotValue = Array.isArray(booking.preferredTimeSlot)
      ? booking.preferredTimeSlot[0]
      : booking.preferredTimeSlot || '';

    // Handle travel preference
    let travelPreference;
    if (booking.artistTravelsToClient === 'both' || booking.artistTravelsToClient === 'Both') {
      travelPreference = 'both';
    } else if (booking.artistTravelsToClient === true || booking.artistTravelsToClient === 'yes') {
      travelPreference = 'yes';
    } else {
      travelPreference = 'no';
    }

    setForm({
      firstName: booking.firstName,
      lastName: booking.lastName,
      email: booking.email,
      eventType: eventTypeValue,
      otherEventType: booking.otherEventType || '',
      eventDate: booking.eventDate ? booking.eventDate.substring(0, 10) : '',
      preferredTimeSlot: timeSlotValue,
      location: booking.location || '',
      latitude: booking.latitude || '',
      longitude: booking.longitude || '',
      artistTravelsToClient: travelPreference,
      venueName: booking.venueName || '',
      minimumBudget: booking.minimumBudget,
      maximumBudget: booking.maximumBudget,
      duration: booking.duration || 3,
      numberOfPeople: booking.numberOfPeople,
      designStyle: booking.designStyle || '',
      designInspiration: Array.isArray(booking.designInspiration) ? booking.designInspiration : (booking.designInspiration ? [booking.designInspiration] : []),
      coveragePreference: booking.coveragePreference || '',
      additionalRequests: booking.additionalRequests || ''
    });
    // Prevent body scroll when modal opens
    document.body.style.overflow = 'hidden';
    setEditOpen(true);
  };

  const closeEditModal = () => {
    setEditOpen(false);
    setEditing(null);
    setLinkInput('');
    // Restore body scroll when modal closes
    document.body.style.overflow = 'auto';
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (Array.isArray(form[name])) {
        setForm(prev => ({
          ...prev,
          [name]: checked ? [...prev[name], value] : prev[name].filter(v => v !== value)
        }));
      } else {
        setForm(prev => ({ ...prev, [name]: checked }));
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    try {
      setSaving(true);
      const payload = { ...form };
      
      // Convert eventType to array
      if (payload.eventType) {
        payload.eventType = [payload.eventType];
      }
      
      // Convert preferredTimeSlot to array
      if (payload.preferredTimeSlot) {
        payload.preferredTimeSlot = [payload.preferredTimeSlot];
      }
      
      // Convert artistTravelsToClient to boolean or 'both'
      if (payload.artistTravelsToClient === 'both') {
        payload.artistTravelsToClient = 'both';
      } else if (payload.artistTravelsToClient === 'yes') {
        payload.artistTravelsToClient = true;
      } else if (payload.artistTravelsToClient === 'no') {
        payload.artistTravelsToClient = false;
      }
      
      // Convert designInspiration to array if it's a string
      if (typeof payload.designInspiration === 'string') {
        payload.designInspiration = payload.designInspiration.split('\n').filter(url => url.trim() !== '');
      }
      
      // convert numbers
      ['minimumBudget', 'maximumBudget', 'duration', 'numberOfPeople'].forEach(k => {
        if (payload[k] !== undefined && payload[k] !== null && payload[k] !== '') {
          payload[k] = Number(payload[k]);
        }
      });
      
      await bookingsAPI.updateBooking(editing._id, payload);
      // refresh list
      const refreshed = await bookingsAPI.getMyBookings();
      setAllBookings(refreshed.data || []);
      closeEditModal();
    } catch (err) {
      alert(err.message || 'Failed to update booking');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (booking) => {
    if (!window.confirm('Delete this booking?')) return;
    try {
      setDeleting(true);
      await bookingsAPI.deleteBooking(booking._id);
      const refreshed = await bookingsAPI.getMyBookings();
      setAllBookings(refreshed.data || []);
    } catch (err) {
      alert(err.message || 'Failed to delete booking');
    } finally {
      setDeleting(false);
    }
  };

  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [completeImages, setCompleteImages] = useState([]);
  const [completeVideo, setCompleteVideo] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoPreview, setVideoPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);

  // Message modal state
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageModalContent, setMessageModalContent] = useState('');

  const openCompleteModal = (booking) => {
    setCompleteTarget(booking);
    setCompleteImages([]);
    setCompleteVideo(null);
    setImagePreviews([]);
    setVideoPreview('');
    setCompleteOpen(true);
  };

  const closeCompleteModal = () => {
    setCompleteOpen(false);
    setCompleteTarget(null);
    setCompleteImages([]);
    setCompleteVideo(null);
    setImagePreviews([]);
    setVideoPreview('');
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 3);
    setCompleteImages(files);
    
    // Create previews
    const previews = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result);
        if (previews.length === files.length) {
          setImagePreviews([...previews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompleteVideo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index) => {
    const newImages = completeImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setCompleteImages(newImages);
    setImagePreviews(newPreviews);
  };

  const removeVideo = () => {
    setCompleteVideo(null);
    setVideoPreview('');
  };

  const openCancelModal = (booking) => {
    setCancelTarget(booking);
    setCancelOpen(true);
  };

  const closeCancelModal = () => {
    setCancelOpen(false);
    setCancelTarget(null);
  };

  const openMessageModal = (message) => {
    setMessageModalContent(message);
    setMessageModalOpen(true);
  };

  const closeMessageModal = () => {
    setMessageModalOpen(false);
    setMessageModalContent('');
  };

  const handleConfirmCancel = async ({ description }) => {
    try {
      // Cancel booking with description only (client side)
      await bookingsAPI.cancelBooking({
        bookingId: cancelTarget._id,
        artistId: cancelTarget.assignedArtist[0]._id,
        cancellationDescription: description
      });
      
      // Refresh bookings
      const refreshed = await bookingsAPI.getMyBookings();
      setAllBookings(refreshed.data || []);
      closeCancelModal();
    } catch (err) {
      alert(err.message || 'Failed to cancel booking');
    }
  };

  const uploadToCloudinary = async (file, resourceType = 'image') => {
    const url = `https://api.cloudinary.com/v1_1/dfoetpdk9/${resourceType}/upload`;
    const fd = new FormData();
    fd.append('file', file);
    // IMPORTANT: replace with your actual unsigned preset name created in Cloudinary settings
    fd.append('upload_preset', 'mehndi');
    const res = await fetch(url, { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Upload failed');
    return data.secure_url || data.url;
  };

  const handleConfirmComplete = async () => {
    if (!completeTarget) return;
    try {
      setUploading(true);
      const imgs = completeImages.slice(0,3);
      const uploaded = [];
      for (const f of imgs) {
        uploaded.push(await uploadToCloudinary(f, 'image'));
      }
      let videoUrl = '';
      if (completeVideo) videoUrl = await uploadToCloudinary(completeVideo, 'video');
      await bookingsAPI.completeBooking(completeTarget._id, { images: uploaded, video: videoUrl });
      const refreshed = await bookingsAPI.getMyBookings();
      setAllBookings(refreshed.data || []);
      closeCompleteModal();
    } catch (err) {
      alert(err.message || 'Failed to complete booking');
    } finally {
      setUploading(false);
    }
  };

  const handleTabChange = (tabId) => {
    if (tabId === 'dashboard') {
      navigate('/dashboard');
    } else if (tabId === 'bookings') {
      // Already on bookings page
      setSidebarOpen(false);
    } else {
      // Navigate to other tabs
      navigate(`/dashboard/${tabId}`);
    }
  };

  // Fetch user's bookings on component mount
  useEffect(() => {
    const fetchBookings = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await bookingsAPI.getMyBookings();
        console.log('Bookings fetched:', response);
        setAllBookings(response.data || []);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setError('Failed to load bookings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [isAuthenticated]);


  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span className="status-badge confirmed">Confirmed</span>;
      case 'completed':
        return <span className="status-badge completed">Completed</span>;
      case 'pending':
        return <span className="status-badge pending">Pending</span>;
      case 'cancelled':
        return <span className="status-badge cancelled">Cancelled</span>;
      case 'in_progress':
        return <span className="status-badge in-progress">In Progress</span>;
      default:
        return <span className="status-badge pending">Pending</span>;
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeSlots) => {
    if (!timeSlots || timeSlots.length === 0) return 'TBD';
    return timeSlots.join(', ');
  };

  // Calculate days until event
  const getDaysUntilEvent = (eventDate) => {
    const today = new Date();
    const event = new Date(eventDate);
    const diffTime = event - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get event title from event type
  const getEventTitle = (eventType, otherEventType) => {
    if (eventType && eventType.length > 0) {
      const types = eventType.join(', ');
      return otherEventType ? `${types} - ${otherEventType}` : types;
    }
    return otherEventType || 'Mehndi Booking';
  };

  // Get artist name
  const getArtistName = (assignedArtist) => {
    if (assignedArtist && assignedArtist.length) {
      return assignedArtist.length > 0 ? 'Yes' : 'No';
    }
    return 'No';
  };

  const upcomingBookings = allBookings.filter(booking =>
    booking.status === 'confirmed' || booking.status === 'pending' || booking.status === 'in_progress'
  );
  const completedBookings = allBookings.filter(booking => booking.status === 'completed');
  const cancelledBookings = allBookings.filter(booking => booking.status === 'cancelled');

  // Show loading state
  if (loading) {
    return (
      <>
        <div className="dashboard-layout">
          <DashboardSidebar
            activeTab="bookings"
            onTabChange={handleTabChange}
            isOpen={sidebarOpen}
            onClose={handleSidebarClose}
            bookingCount={allBookings.length}
          />
          <div className="dashboard-main-content">
            <button
              className="mobile-sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="bookings-page">
              <div className="bookings-container">
                <div className="loading-state">
                  <div className="loading-spinner">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="31.416" strokeDashoffset="31.416">
                        <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite" />
                        <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite" />
                      </circle>
                    </svg>
                  </div>
                  <h2>Loading your bookings...</h2>
                  <p>Please wait while we fetch your booking information.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </>
    );
  }

  // Show error state
  if (error) {
    return (
      <>
        <div className="dashboard-layout">
          <DashboardSidebar
            activeTab="bookings"
            onTabChange={handleTabChange}
            isOpen={sidebarOpen}
            onClose={handleSidebarClose}
            bookingCount={allBookings.length}
          />
          <div className="dashboard-main-content">
            <button
              className="mobile-sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="bookings-page">
              <div className="bookings-container">
                <div className="error-state">
                  <div className="error-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  </div>
                  <h2>Error Loading Bookings</h2>
                  <p>{error}</p>
                  <button
                    className="btn-primary"
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Show empty state
  if (allBookings.length === 0) {
    return (
      <>
        <div className="dashboard-layout">
          <DashboardSidebar
            activeTab="bookings"
            onTabChange={handleTabChange}
            isOpen={sidebarOpen}
            onClose={handleSidebarClose}
            bookingCount={allBookings.length}
          />
          <div className="dashboard-main-content">
            <button
              className="mobile-sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="bookings-page">
              <div className="bookings-container">
                <div className="empty-state">
                  <div className="empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </div>
                  <h2>No Bookings Yet</h2>
                  <p>You haven't made any bookings yet. Start by creating your first mehndi appointment!</p>
                  <Link to="/booking" className="btn-primary">
                    Book Your First Appointment
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="dashboard-layout">
        {/* Sidebar */}
        <DashboardSidebar
          activeTab="bookings"
          onTabChange={handleTabChange}
          isOpen={sidebarOpen}
          onClose={handleSidebarClose}
          bookingCount={allBookings.length}
        />

        {/* Main Content */}
        <div className="dashboard-main-content">
          {/* Mobile Sidebar Toggle */}
          <button
            className="mobile-sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="bookings-page">
            <div className="bookings-container">
              <div className="bookings-header">
                <h1 className="bookings-title">All Bookings</h1>
                <p className="bookings-subtitle">Manage all your mehndi appointments</p>
              </div>

              {/* Booking Stats */}
              <div className="booking-stats">
                <div className="stat-card">
                  <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </div>
                  <div className="stat-info">
                    <h3>Total Bookings</h3>
                    <span className="stat-number">{allBookings.length}</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12,6 12,12 16,14" />
                    </svg>
                  </div>
                  <div className="stat-info">
                    <h3>Upcoming</h3>
                    <span className="stat-number">{upcomingBookings.length}</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  </div>
                  <div className="stat-info">
                    <h3>Completed</h3>
                    <span className="stat-number">{completedBookings.length}</span>
                  </div>
                </div>
              </div>

              {/* Upcoming Bookings */}
              {upcomingBookings.length > 0 && (
                <div className="bookings-section">
                  <h2 className="section-title"><FaCalendarAlt /> Upcoming Bookings</h2>
                  <div className="bookings-grid">
                    {upcomingBookings.map(booking => {
                      const daysLeft = getDaysUntilEvent(booking.eventDate);
                      return (
                        <div key={booking._id} className="booking-card compact">
                          <div className="card-header">
                            <div className="card-title-section">
                              <h3 className="booking-title">{getEventTitle(booking.eventType, booking.otherEventType)}</h3>
                              <div className="booking-meta">
                                <span className="meta-badge">🎨 {booking.designStyle}</span>
                                <span className="meta-badge">👥 {booking.numberOfPeople} people</span>
                              </div>
                            </div>
                            <div className="card-actions">
                              {getStatusBadge(booking.status)}
                              {booking.status === 'confirmed' && (
                                  <button className="btn-secondary" onClick={() => openCancelModal(booking)} style={{marginLeft:'8px', background: '#e74c3c', color: 'white', border: 'none', padding: '14px 20px', fontSize: '0.95rem'}}>Cancel</button>
                              )}
                              {booking.status === 'confirmed' && booking.isPaid==='full' && (
                              <button
                                className="btn-primary"
                                onClick={() => {
                                  const today = new Date();
                                  const eventDate = new Date(booking.eventDate);
                                  if (eventDate <= today) {
                                    openCompleteModal(booking);
                                  } else {
                                    openMessageModal('You can only mark as complete once the event date has passed.');
                                  }
                                }}
                                style={{marginLeft:'8px'}}
                              >
                                Mark as complete
                              </button>
                               )}
                              {booking.status == 'pending' &&
                                <>
                                  <button className="icon-btn edit" onClick={() => openEditModal(booking)} title="Edit booking">✏️
                                  </button>

                                  <button className="icon-btn delete" onClick={() => handleDelete(booking)} title="Delete booking">🗑️</button>
                            </>
                              }
                              </div>
                          </div>

                          <div className="card-content">
                            <div className="info-row">
                              <div className="info-item">
                                <span className="info-label">Artist Assigned</span>
                                <span className="info-value">{getArtistName(booking.assignedArtist)}</span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">Date & Time</span>
                                <span className="info-value">{formatDate(booking.eventDate)} • {formatTime(booking.preferredTimeSlot)}</span>
                              </div>
                            </div>

                            <div className="info-row">
                              <div className="info-item">
                                <span className="info-label">Location</span>
                                <span className="info-value">{booking.location}</span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">Budget</span>
                                <span className="info-value">£{booking.minimumBudget} - £{booking.maximumBudget}</span>
                              </div>
                            </div>

                            <div className="info-row">
                              <div className="info-item">
                                <span className="info-label">Duration</span>
                                <span className="info-value">{booking.duration || 3} hours</span>
                            </div>

                            {daysLeft > 0 && (
                                <div className="info-item">
                                  <span className="info-label">Days Left</span>
                                  <span className="info-value highlight">{daysLeft} days</span>
                              </div>
                            )}
                            {daysLeft <= 0 && (
                                <div className="info-item">
                                  <span className="info-label">Status</span>
                                  <span className="info-value highlight">{daysLeft === 0 ? 'Today!' : 'Overdue'}</span>
                              </div>
                            )}
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Completed Bookings */}
              {completedBookings.length > 0 && (
                <div className="bookings-section">
                  <h2 className="section-title">  <FaCheckCircle /> Completed Bookings</h2>
                  <div className="bookings-grid">
                    {completedBookings.map(booking => (
                      <div key={booking._id} className="booking-card compact completed">
                        <div className="card-header">
                          <div className="card-title-section">
                            <h3 className="booking-title">{getEventTitle(booking.eventType, booking.otherEventType)}</h3>
                            <div className="booking-meta">
                              <span className="meta-badge">🎨 {booking.designStyle}</span>
                              <span className="meta-badge">👥 {booking.numberOfPeople} people</span>
                            </div>
                          </div>
                        </div>

                        <div className="card-content">
                          <div className="info-row">
                            <div className="info-item">
                              <span className="info-label">Artist</span>
                              <span className="info-value">{getArtistName(booking.assignedArtist)}</span>
                            </div>
                            <div className="info-item">
                              <span className="info-label">Date & Time</span>
                              <span className="info-value">{formatDate(booking.eventDate)} • {formatTime(booking.preferredTimeSlot)}</span>
                            </div>
                          </div>

                          <div className="info-row">
                            <div className="info-item">
                              <span className="info-label">Location</span>
                              <span className="info-value">{booking.location}</span>
                            </div>
                            <div className="info-item">
                              <span className="info-label">Budget</span>
                              <span className="info-value">£{booking.minimumBudget} - £{booking.maximumBudget}</span>
                            </div>
                          </div>

                          <div className="info-row">
                            <div className="info-item">
                              <span className="info-label">Duration</span>
                              <span className="info-value">{booking.duration || 3} hours</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cancelled Bookings */}
              {cancelledBookings.length > 0 && (
                <div className="bookings-section">
                  <h2 className="section-title"><FaTimesCircle /> Cancelled Bookings</h2>
                  <div className="bookings-grid">
                    {cancelledBookings.map(booking => (
                      <div key={booking._id} className="booking-card compact cancelled">
                        <div className="card-header">
                          <div className="card-title-section">
                            <h3 className="booking-title">{getEventTitle(booking.eventType, booking.otherEventType)}</h3>
                            <div className="booking-meta">
                              <span className="meta-badge">🎨 {booking.designStyle}</span>
                              <span className="meta-badge">👥 {booking.numberOfPeople} people</span>
                            </div>
                          </div>
                        </div>

                        <div className="card-content">
                          <div className="info-row">
                            <div className="info-item">
                              <span className="info-label">Artist</span>
                              <span className="info-value">{getArtistName(booking.assignedArtist)}</span>
                            </div>
                            <div className="info-item">
                              <span className="info-label">Date & Time</span>
                              <span className="info-value">{formatDate(booking.eventDate)} • {formatTime(booking.preferredTimeSlot)}</span>
                            </div>
                          </div>

                          <div className="info-row">
                            <div className="info-item">
                              <span className="info-label">Location</span>
                              <span className="info-value">{booking.location}</span>
                            </div>
                            <div className="info-item">
                              <span className="info-label">Budget</span>
                              <span className="info-value">£{booking.minimumBudget} - £{booking.maximumBudget}</span>
                            </div>
                          </div>

                          <div className="info-row">
                            <div className="info-item">
                              <span className="info-label">Duration</span>
                              <span className="info-value">{booking.duration || 3} hours</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {editOpen && (
            <div className="modal-overlay" onClick={closeEditModal} style={{
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
                  <button onClick={closeEditModal} style={{
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
                            border: `2px solid ${form.eventType === opt.value ? '#CD853F' : '#e0d5c9'}`,
                            borderRadius: '12px',
                            background: form.eventType === opt.value ? '#fff8f0' : '#faf8f5',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            position: 'relative'
                          }} onClick={() => setForm(prev => ({ ...prev, eventType: opt.value }))}>
                            <input
                              type="radio"
                              name="eventType"
                              value={opt.value}
                              checked={form.eventType === opt.value}
                              onChange={() => setForm(prev => ({ ...prev, eventType: opt.value }))}
                              style={{ display: 'none' }}
                            />
                            <span style={{ fontSize: '1.5rem' }}>{opt.emoji}</span>
                            <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{opt.value}</span>
                            {form.eventType === opt.value && (
                              <span style={{ position: 'absolute', right: '16px', color: '#CD853F', fontWeight: 'bold', fontSize: '1.2rem' }}>✓</span>
                            )}
                          </label>
                        ))}
                      </div>
                      <input
                        name="otherEventType"
                        placeholder="Other:"
                        value={form.otherEventType || ''}
                        onChange={handleFormChange}
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
                      <input name="eventDate" type="date" value={form.eventDate || ''} onChange={handleFormChange} style={{
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
                            border: `2px solid ${form.preferredTimeSlot === opt.value ? '#CD853F' : '#e0d5c9'}`,
                            borderRadius: '12px',
                            background: form.preferredTimeSlot === opt.value ? '#fff8f0' : '#faf8f5',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            position: 'relative'
                          }} onClick={() => setForm(prev => ({ ...prev, preferredTimeSlot: opt.value }))}>
                            <input
                              type="radio"
                              name="preferredTimeSlot"
                              value={opt.value}
                              checked={form.preferredTimeSlot === opt.value}
                              onChange={() => setForm(prev => ({ ...prev, preferredTimeSlot: opt.value }))}
                              style={{ display: 'none' }}
                            />
                            <span style={{ fontSize: '1.5rem' }}>{opt.icon}</span>
                            <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{opt.value}</span>
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
                      {form.location && (
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
                          <span>{form.location}</span>
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
                            border: `2px solid ${form.artistTravelsToClient === opt.value ? '#CD853F' : '#e0d5c9'}`,
                            borderRadius: '12px',
                            background: form.artistTravelsToClient === opt.value ? '#fff8f0' : '#faf8f5',
                          cursor: 'pointer',
                            transition: 'all 0.3s',
                            position: 'relative'
                          }} onClick={() => setForm(prev => ({ ...prev, artistTravelsToClient: opt.value }))}>
                            <input type="radio" name="artistTravelsToClientRadio" checked={form.artistTravelsToClient === opt.value} onChange={() => setForm(prev => ({ ...prev, artistTravelsToClient: opt.value }))} style={{ display: 'none' }} />
                            <span style={{ fontSize: '1.5rem' }}>{opt.icon}</span>
                            <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{opt.text}</span>
                        </label>
                        ))}
                      </div>
                    </div>

                    {/* Venue Name */}
                    <div>
                      <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>Venue Name</label>
                      <input name="venueName" value={form.venueName || ''} onChange={handleFormChange} placeholder="Enter venue name (optional)" style={{
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
                            border: `2px solid ${form.designStyle === opt ? '#CD853F' : '#e0d5c9'}`,
                            borderRadius: '12px',
                            background: form.designStyle === opt ? '#fff8f0' : '#faf8f5',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            position: 'relative'
                          }} onClick={() => setForm(prev => ({ ...prev, designStyle: opt }))}>
                            <input
                              type="radio"
                              name="designStyle"
                              value={opt}
                              checked={form.designStyle === opt}
                              onChange={() => setForm(prev => ({ ...prev, designStyle: opt }))}
                              style={{ display: 'none' }}
                            />
                            <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{opt}</span>
                            {form.designStyle === opt && (
                              <span style={{ position: 'absolute', right: '16px', color: '#CD853F', fontWeight: 'bold', fontSize: '1.2rem' }}>✓</span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Design Inspiration */}
                    <div>
                      <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>Design Inspiration</label>
                      <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1rem' }}>Upload images or paste links to share your preferred designs</p>
                      
                      {/* Upload Images */}
                      <div style={{ marginBottom: '1rem' }}>
                        <label
                          htmlFor="design-inspiration-upload"
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
                          onMouseEnter={(e) => e.target.style.background = '#fff8f0'}
                          onMouseLeave={(e) => e.target.style.background = '#faf8f5'}
                        >
                          {uploadingInspiration ? 'Uploading...' : '📸 Upload Images'}
                          <input
                            type="file"
                            id="design-inspiration-upload"
                            multiple
                            accept="image/*"
                            onChange={handleInspirationImageUpload}
                            disabled={uploadingInspiration}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>

                      {/* Paste Link */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <input
                          type="url"
                          placeholder="Paste image link here..."
                          value={linkInput}
                          onChange={(e) => setLinkInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
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
                            outline: 'none',
                            transition: 'all 0.3s'
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddInspirationLink}
                          disabled={!linkInput.trim()}
                          style={{
                            padding: '12px 24px',
                            background: '#CD853F',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            opacity: linkInput.trim() ? 1 : 0.6,
                            transition: 'all 0.3s'
                          }}
                        >
                          Add
                        </button>
                      </div>

                      {/* Uploaded Images Preview */}
                      {Array.isArray(form.designInspiration) && form.designInspiration.length > 0 && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9f9f9', borderRadius: '10px' }}>
                          <p style={{ fontSize: '0.85rem', color: '#8B4513', marginBottom: '0.5rem', fontWeight: '600' }}>
                            Your Inspiration Images ({form.designInspiration.length}):
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem' }}>
                            {form.designInspiration.map((url, idx) => (
                              <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', border: '2px solid #e0d5c9' }}>
                                <img src={url} alt={`Inspiration ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.target.style.display = 'none'} />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveInspirationImage(idx)}
                                  style={{
                                    position: 'absolute', top: '4px', right: '4px', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255, 0, 0, 0.8)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1'
                                  }} title="Remove image">×</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Coverage Preference */}
                    <div>
                      <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>Coverage Preference (for bridal)</label>
                      <select name="coveragePreference" value={form.coveragePreference || ''} onChange={handleFormChange} style={{
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
                          <input name="minimumBudget" type="number" value={form.minimumBudget || ''} onChange={handleFormChange} placeholder="From" style={{
                            border: 'none',
                            background: 'transparent',
                            fontSize: '1rem',
                            flex: 1,
                            outline: 'none'
                      }} />
                    </div>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e0d5c9', borderRadius: '10px', padding: '8px 16px', background: '#faf8f5' }}>
                          <span style={{ fontWeight: '600', color: '#8B4513', marginRight: '8px' }}>£</span>
                          <input name="maximumBudget" type="number" value={form.maximumBudget || ''} onChange={handleFormChange} placeholder="To" style={{
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
                          <button type="button" key={preset.label} onClick={() => setForm(prev => ({ ...prev, minimumBudget: preset.from, maximumBudget: preset.to }))} style={{
                            padding: '10px 20px',
                            border: `2px solid ${form.minimumBudget == preset.from && form.maximumBudget == preset.to ? '#CD853F' : '#e0d5c9'}`,
                            borderRadius: '8px',
                            background: form.minimumBudget == preset.from && form.maximumBudget == preset.to ? '#CD853F' : '#faf8f5',
                            color: form.minimumBudget == preset.from && form.maximumBudget == preset.to ? 'white' : '#8B4513',
                            fontWeight: '500',
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                          }}>{preset.label}</button>
                        ))}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#888' }}>
                        Final price may vary depending on design, travel, and number of people. You'll receive a full quote before confirming your booking.
                      </p>
                    </div>

                    {/* Number of People */}
                    <div>
                      <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>How many people need Mehndi? (for group bookings) *</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid #e0d5c9', borderRadius: '10px', background: '#faf8f5', padding: '8px', width: 'fit-content' }}>
                        <button type="button" onClick={() => setForm(prev => ({ ...prev, numberOfPeople: Math.max(1, (prev.numberOfPeople || 1) - 1) }))} style={{
                          width: '40px', height: '40px', border: 'none', borderRadius: '8px', background: 'white', fontSize: '1.3rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s', color: '#8B4513'
                        }}>-</button>
                        <span style={{ fontSize: '1.2rem', fontWeight: '600', minWidth: '40px', textAlign: 'center' }}>{form.numberOfPeople || 1}</span>
                        <button type="button" onClick={() => setForm(prev => ({ ...prev, numberOfPeople: (prev.numberOfPeople || 1) + 1 }))} style={{
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
                      <textarea name="additionalRequests" rows="4" value={form.additionalRequests || ''} onChange={handleFormChange} placeholder="Write your notes here..." style={{
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
                <div style={{
                  flexShrink: 0,
                  borderTop: '1px solid #e8ddd4',
                  padding: '1.5rem 2.5rem',
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'flex-end',
                  background: '#faf8f5'
                }}>
                  <button onClick={closeEditModal} disabled={saving} style={{
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
                  <button onClick={handleSave} disabled={saving} style={{
                    padding: '14px 32px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: 'white',
                    backgroundColor: '#CD853F',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                    transition: 'all 0.3s',
                    boxShadow: saving ? 'none' : '0 4px 12px rgba(205, 133, 63, 0.3)'
                  }}>{saving ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {completeOpen && (
        <div className="modal-overlay" onClick={closeCompleteModal}>
          <div className="modal" onClick={(e)=>e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">Complete Booking</h3>
              <button className="modal-close" onClick={closeCompleteModal}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '20px', color: '#666' }}>Upload up to 3 images and one video (optional). Files will be uploaded to Cloudinary.</p>
              
              {/* Images Upload Section */}
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '10px', color: '#333' }}>
                  Images (max 3)
                </label>
                <label htmlFor="complete-images-upload" className="upload-label" style={{ 
                  display: 'block',
                  padding: '20px',
                  border: '2px dashed #d4a574',
                  borderRadius: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: '#faf8f5',
                  transition: 'all 0.3s ease'
                }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d4a574" strokeWidth="2" style={{ margin: '0 auto 10px' }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <p style={{ margin: '0', color: '#d4a574', fontWeight: '600' }}>
                    Click to upload images
                  </p>
                  <small style={{ color: '#888' }}>PNG, JPG, WEBP • Max 3 images</small>
                </label>
                <input
                  type="file"
                  id="complete-images-upload"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
                
                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '15px' }}>
                    {imagePreviews.map((preview, index) => (
                      <div key={index} style={{ position: 'relative' }}>
                        <img 
                          src={preview} 
                          alt={`Preview ${index + 1}`} 
                          style={{ 
                            width: '100%', 
                            height: '120px', 
                            objectFit: 'cover', 
                            borderRadius: '8px',
                            border: '2px solid #d4a574'
                          }} 
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          style={{
                            position: 'absolute',
                            top: '5px',
                            right: '5px',
                            background: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '25px',
                            height: '25px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Video Upload Section */}
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '10px', color: '#333' }}>
                  Video (optional)
                </label>
                <label htmlFor="complete-video-upload" className="upload-label" style={{ 
                  display: 'block',
                  padding: '20px',
                  border: '2px dashed #d4a574',
                  borderRadius: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: '#faf8f5',
                  transition: 'all 0.3s ease'
                }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d4a574" strokeWidth="2" style={{ margin: '0 auto 10px' }}>
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                  <p style={{ margin: '0', color: '#d4a574', fontWeight: '600' }}>
                    Click to upload video
                  </p>
                  <small style={{ color: '#888' }}>MP4, MOV, AVI • Optional</small>
                </label>
                <input
                  type="file"
                  id="complete-video-upload"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  style={{ display: 'none' }}
                />
                
                {/* Video Preview */}
                {videoPreview && (
                  <div style={{ marginTop: '15px', position: 'relative' }}>
                    <video 
                      src={videoPreview} 
                      controls
                      style={{ 
                        width: '100%', 
                        maxHeight: '200px', 
                        borderRadius: '8px',
                        border: '2px solid #d4a574'
                      }} 
                    />
                    <button
                      type="button"
                      onClick={removeVideo}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        cursor: 'pointer',
                        fontSize: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeCompleteModal}>Cancel</button>
              <button className="btn-primary" onClick={handleConfirmComplete} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Confirm & Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      <CancelAcceptedModal
        isOpen={cancelOpen}
        onClose={closeCancelModal}
        onConfirm={handleConfirmCancel}
        showReasonDropdown={false}
      />

      {/* Message Modal */}
      {messageModalOpen && (
        <div className="modal-overlay" onClick={closeMessageModal}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              maxWidth: '450px',
              width: '90%',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '1px solid #e5e7eb',
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#111827',
              }}>
                Notice
              </h3>
              <button 
                onClick={closeMessageModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '0',
                  lineHeight: '1',
                  transition: 'color 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.color = '#111827'}
                onMouseOut={(e) => e.target.style.color = '#6b7280'}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              <p style={{
                margin: '0 0 24px 0',
                fontSize: '1rem',
                color: '#4b5563',
                lineHeight: '1.5',
              }}>
                {messageModalContent}
              </p>

              {/* Modal Actions */}
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
              }}>
                <button 
                  onClick={closeMessageModal}
                  style={{
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'white',
                    backgroundColor: 'var(--first-color)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.opacity = '0.9'}
                  onMouseOut={(e) => e.target.style.opacity = '1'}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Get Location Modal */}
      <GetLocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSelect={handleLocationSelect}
      />
    </>
  );
};

export default AllBookings;
// Edit Modal
// Keeping markup minimal and reusing schema fields
// Render modal near root return above sections
