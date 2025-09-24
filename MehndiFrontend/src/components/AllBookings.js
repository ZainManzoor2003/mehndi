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

  // Sidebar handlers
  const handleSidebarClose = () => {
    setSidebarOpen(false);
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
    if (assignedArtist && assignedArtist.firstName) {
      return `${assignedArtist.firstName} ${assignedArtist.lastName}`;
    }
    return 'TBD - No artist assigned yet';
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
              onClick={() => setSidebarOpen(true)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div className="bookings-page">
              <div className="bookings-container">
                <div className="loading-state">
                  <div className="loading-spinner">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="31.416" strokeDashoffset="31.416">
                        <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                        <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
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
              onClick={() => setSidebarOpen(true)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div className="bookings-page">
              <div className="bookings-container">
                <div className="error-state">
                  <div className="error-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
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
              onClick={() => setSidebarOpen(true)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div className="bookings-page">
              <div className="bookings-container">
                <div className="empty-state">
                  <div className="empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
                      <line x1="12" y1="17" x2="12" y2="21"/>
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
            onClick={() => setSidebarOpen(true)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
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
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
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
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
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
                    <polyline points="20,6 9,17 4,12"/>
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
                          {getStatusBadge(booking.status)}
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
                        {getStatusBadge(booking.status)}
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
                        {getStatusBadge(booking.status)}
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
        </div>
      </div>
    </>
  );
};

export default AllBookings;
