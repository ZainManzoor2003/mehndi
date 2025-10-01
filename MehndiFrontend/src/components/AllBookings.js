import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import DashboardSidebar from './DashboardSidebar';
import apiService from '../services/api';

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

  // Sidebar handlers
  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const openEditModal = (booking) => {
    setEditing(booking);
    setForm({
      firstName: booking.firstName,
      lastName: booking.lastName,
      email: booking.email,
      phoneNumber: booking.phoneNumber,
      eventType: booking.eventType || [],
      otherEventType: booking.otherEventType || '',
      eventDate: booking.eventDate ? booking.eventDate.substring(0, 10) : '',
      preferredTimeSlot: booking.preferredTimeSlot || [],
      location: booking.location || '',
      artistTravelsToClient: booking.artistTravelsToClient,
      fullAddress: booking.fullAddress || '',
      city: booking.city || '',
      postalCode: booking.postalCode || '',
      venueName: booking.venueName || '',
      minimumBudget: booking.minimumBudget,
      maximumBudget: booking.maximumBudget,
      duration: booking.duration,
      numberOfPeople: booking.numberOfPeople,
      designStyle: booking.designStyle || '',
      designComplexity: booking.designComplexity || '',
      bodyPartsToDecorate: booking.bodyPartsToDecorate || [],
      designInspiration: booking.designInspiration || '',
      coveragePreference: booking.coveragePreference || '',
      additionalRequests: booking.additionalRequests || ''
    });
    setEditOpen(true);
  };

  const closeEditModal = () => {
    setEditOpen(false);
    setEditing(null);
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

        {editOpen && (
          <div className="modal-overlay" onClick={closeEditModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Edit Booking</h3>
                <button className="modal-close" onClick={closeEditModal}>×</button>
              </div>
              <div className="modal-body">
                <div className="modal-grid">
                  <div className="form-group">
                    <label>First name</label>
                    <input name="firstName" value={form.firstName || ''} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Last name</label>
                    <input name="lastName" value={form.lastName || ''} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input name="email" type="email" value={form.email || ''} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input name="phoneNumber" value={form.phoneNumber || ''} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Event date</label>
                    <input name="eventDate" type="date" value={form.eventDate || ''} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input name="location" value={form.location || ''} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <input name="fullAddress" value={form.fullAddress || ''} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input name="city" value={form.city || ''} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Postal code</label>
                    <input name="postalCode" value={form.postalCode || ''} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Budget min</label>
                    <input name="minimumBudget" type="number" value={form.minimumBudget ?? ''} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Budget max</label>
                    <input name="maximumBudget" type="number" value={form.maximumBudget ?? ''} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Duration (hours)</label>
                    <input name="duration" type="number" value={form.duration ?? ''} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>People</label>
                    <input name="numberOfPeople" type="number" value={form.numberOfPeople ?? ''} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Design style</label>
                    <input name="designStyle" value={form.designStyle || ''} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Complexity</label>
                    <input name="designComplexity" value={form.designComplexity || ''} onChange={handleFormChange} />
                  </div>
                  <div className="form-group full">
                    <label>Additional requests</label>
                    <textarea name="additionalRequests" rows="3" value={form.additionalRequests || ''} onChange={handleFormChange} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={closeEditModal} disabled={saving}>Cancel</button>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
              </div>
            </div>
          </div>
        )}
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
                  <h2 className="section-title">📅 Upcoming Bookings</h2>
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
                                <button className="btn-primary" onClick={() => openCompleteModal(booking)} style={{marginLeft:'8px'}}>Mark as complete</button>
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
                                <span className="info-value">{booking.duration} hours</span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">Complexity</span>
                                <span className="info-value">{booking.designComplexity}</span>
                              </div>
                            </div>

                            {daysLeft > 0 && (
                              <div className="info-row">
                                <div className="info-item">
                                  <span className="info-label">Days Left</span>
                                  <span className="info-value highlight">{daysLeft} days</span>
                                </div>
                              </div>
                            )}
                            {daysLeft <= 0 && (
                              <div className="info-row">
                                <div className="info-item">
                                  <span className="info-label">Status</span>
                                  <span className="info-value highlight">{daysLeft === 0 ? 'Today!' : 'Overdue'}</span>
                                </div>
                              </div>
                            )}
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
                  <h2 className="section-title">✅ Completed Bookings</h2>
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
                              <span className="info-value">{booking.duration} hours</span>
                            </div>
                            <div className="info-item">
                              <span className="info-label">Complexity</span>
                              <span className="info-value">{booking.designComplexity}</span>
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
                  <h2 className="section-title">❌ Cancelled Bookings</h2>
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
                          <div className="card-actions">
                            {getStatusBadge(booking.status)}
                            <button className="icon-btn edit" onClick={() => openEditModal(booking)} title="Edit booking">✏️</button>
                            <button className="icon-btn delete" onClick={() => handleDelete(booking)} title="Delete booking">🗑️</button>
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
                              <span className="info-value">{booking.duration} hours</span>
                            </div>
                            <div className="info-item">
                              <span className="info-label">Complexity</span>
                              <span className="info-value">{booking.designComplexity}</span>
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
            <div className="modal-overlay" onClick={closeEditModal}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 className="modal-title">Edit Booking</h3>
                  <button className="modal-close" onClick={closeEditModal}>×</button>
                </div>
                <div className="modal-body">
                  <div className="modal-grid">
                    <div className="form-group">
                      <label>First name</label>
                      <input name="firstName" value={form.firstName || ''} onChange={handleFormChange} />
                    </div>
                    <div className="form-group">
                      <label>Last name</label>
                      <input name="lastName" value={form.lastName || ''} onChange={handleFormChange} />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input name="email" type="email" value={form.email || ''} onChange={handleFormChange} />
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input name="phoneNumber" value={form.phoneNumber || ''} onChange={handleFormChange} />
                    </div>
                    <div className="form-group">
                      <label>Event date</label>
                      <input name="eventDate" type="date" value={form.eventDate || ''} onChange={handleFormChange} />
                    </div>
                    <div className="form-group full">
                      <label>Event type</label>
                      <div className="checkbox-grid">
                        {['Wedding', 'Eid', 'Party', 'Festival'].map(opt => (
                          <label key={opt} className="checkbox-label">
                            <input
                              type="checkbox"
                              name="eventType"
                              value={opt}
                              checked={(form.eventType || []).includes(opt)}
                              onChange={handleFormChange}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                      <input
                        name="otherEventType"
                        placeholder="Other event type"
                        value={form.otherEventType || ''}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="form-group full">
                      <label>Preferred time slot</label>
                      <div className="checkbox-grid">
                        {['Morning', 'Afternoon', 'Evening', 'Flexible'].map(opt => (
                          <label key={opt} className="checkbox-label">
                            <input
                              type="checkbox"
                              name="preferredTimeSlot"
                              value={opt}
                              checked={(form.preferredTimeSlot || []).includes(opt)}
                              onChange={handleFormChange}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="form-group full">
                      <label>Artist travel preference</label>
                      <div className="radio-group">
                        <label className="radio-label">
                          <input type="radio" name="artistTravelsToClientRadio" checked={form.artistTravelsToClient === true} onChange={() => setForm(prev => ({ ...prev, artistTravelsToClient: true }))} />
                          <span>Artist travels to me</span>
                        </label>
                        <label className="radio-label">
                          <input type="radio" name="artistTravelsToClientRadio" checked={form.artistTravelsToClient === false} onChange={() => setForm(prev => ({ ...prev, artistTravelsToClient: false }))} />
                          <span>I travel to artist</span>
                        </label>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Location</label>
                      <input name="location" value={form.location || ''} onChange={handleFormChange} />
                    </div>
                    <div className="form-group">
                      <label>Address</label>
                      <input name="fullAddress" value={form.fullAddress || ''} onChange={handleFormChange} />
                    </div>
                    <div className="form-group">
                      <label>City</label>
                      <input name="city" value={form.city || ''} onChange={handleFormChange} />
                    </div>
                    <div className="form-group">
                      <label>Postal code</label>
                      <input name="postalCode" value={form.postalCode || ''} onChange={handleFormChange} />
                    </div>
                    <div className="form-group">
                      <label>Budget min</label>
                      <input name="minimumBudget" type="number" value={form.minimumBudget ?? ''} onChange={handleFormChange} />
                    </div>
                    <div className="form-group">
                      <label>Budget max</label>
                      <input name="maximumBudget" type="number" value={form.maximumBudget ?? ''} onChange={handleFormChange} />
                    </div>
                    <div className="form-group">
                      <label>Duration (hours)</label>
                      <input name="duration" type="number" value={form.duration ?? ''} onChange={handleFormChange} />
                    </div>
                    <div className="form-group">
                      <label>People</label>
                      <input name="numberOfPeople" type="number" value={form.numberOfPeople ?? ''} onChange={handleFormChange} />
                    </div>
                    <div className="form-group">
                      <label>Design style</label>
                      <select name="designStyle" value={form.designStyle || ''} onChange={handleFormChange}>
                        <option value="">Select style</option>
                        {['Traditional', 'Modern', 'Arabic', 'Indian', 'Moroccan', 'Minimalist', 'Bridal'].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Complexity</label>
                      <select name="designComplexity" value={form.designComplexity || ''} onChange={handleFormChange}>
                        <option value="">Select complexity</option>
                        {['Simple', 'Medium', 'Complex', 'Very Complex'].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group full">
                      <label>Body parts to decorate</label>
                      <div className="checkbox-grid">
                        {['Hands', 'Feet', 'Arms', 'Back'].map(opt => (
                          <label key={opt} className="checkbox-label">
                            <input
                              type="checkbox"
                              name="bodyPartsToDecorate"
                              value={opt}
                              checked={(form.bodyPartsToDecorate || []).includes(opt)}
                              onChange={handleFormChange}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Coverage preference</label>
                      <select name="coveragePreference" value={form.coveragePreference || ''} onChange={handleFormChange}>
                        <option value="">Select coverage</option>
                        {['Light', 'Medium', 'Full', 'Bridal Package'].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Venue name</label>
                      <input name="venueName" value={form.venueName || ''} onChange={handleFormChange} />
                    </div>
                    <div className="form-group full">
                      <label>Design inspiration</label>
                      <textarea name="designInspiration" rows="3" value={form.designInspiration || ''} onChange={handleFormChange} />
                    </div>
                    <div className="form-group full">
                      <label>Additional requests</label>
                      <textarea name="additionalRequests" rows="3" value={form.additionalRequests || ''} onChange={handleFormChange} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn-secondary" onClick={closeEditModal} disabled={saving}>Cancel</button>
                  <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
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
    </>
  );
};

export default AllBookings;
// Edit Modal
// Keeping markup minimal and reusing schema fields
// Render modal near root return above sections
