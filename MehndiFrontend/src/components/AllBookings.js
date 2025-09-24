import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';

const AllBookings = () => {
  const { user, isAuthenticated } = useAuth();

  // Mock data for all bookings
  const [allBookings] = useState([
    {
      id: 1,
      title: 'Bridal Mehndi',
      artist: 'Zara Henna Arts',
      date: 'Oct 10, 2025',
      time: '3:00 PM',
      status: 'confirmed',
      price: '£500',
      location: '123 Celebration Hall, Downtown City',
      depositPaid: true,
      finalPaymentDue: 'Sep 26, 2025',
      daysLeft: 20
    },
    {
      id: 2,
      title: 'Eid Mehndi',
      artist: 'Henna by Sana',
      date: 'Sep 15, 2025',
      time: '6:00 PM',
      status: 'confirmed',
      price: '£280',
      location: '456 Garden Villa, Suburb',
      depositPaid: true,
      finalPaymentDue: 'Sep 1, 2025',
      daysLeft: 25
    },
    {
      id: 3,
      title: 'Birthday Party Mehndi',
      artist: 'Artistic Henna',
      date: 'Feb 10, 2024',
      time: '4:00 PM',
      status: 'completed',
      price: '£280',
      location: '789 Party Center, City',
      depositPaid: true,
      finalPaymentDue: 'Paid',
      daysLeft: 0
    },
    {
      id: 4,
      title: 'Festival Celebration',
      artist: 'Mehndi Magic',
      date: 'Jan 20, 2024',
      time: '6:00 PM',
      status: 'completed',
      price: '£320',
      location: '321 Event Hall, Downtown',
      depositPaid: true,
      finalPaymentDue: 'Paid',
      daysLeft: 0
    },
    {
      id: 5,
      title: 'Wedding Mehndi',
      artist: 'Zara Henna Arts',
      date: 'Mar 15, 2024',
      time: '2:00 PM',
      status: 'completed',
      price: '£450',
      location: '555 Wedding Venue, City',
      depositPaid: true,
      finalPaymentDue: 'Paid',
      daysLeft: 0
    }
  ]);


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
      default:
        return <span className="status-badge pending">Pending</span>;
    }
  };

  const upcomingBookings = allBookings.filter(booking => booking.status === 'confirmed');
  const completedBookings = allBookings.filter(booking => booking.status === 'completed');

  return (
    <>
      <Header />
      <div className="bookings-page">
        <div className="bookings-container">
            {/* Back to Dashboard Button */}
            <div className="bookings-nav">
              <Link to="/dashboard" className="back-to-dashboard-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19L5 12L12 5"/>
                </svg>
                Back to Dashboard
              </Link>
            </div>

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
            <div className="bookings-section">
              <h2 className="section-title">📅 Upcoming Bookings</h2>
              <div className="bookings-grid">
                {upcomingBookings.map(booking => (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-header">
                      <h3 className="booking-title">{booking.title}</h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    
                    <div className="booking-details">
                      <div className="booking-info">
                        <p><strong>Artist:</strong> {booking.artist}</p>
                        <p><strong>Date & Time:</strong> {booking.date} · {booking.time}</p>
                        <p><strong>Location:</strong> {booking.location}</p>
                        <p><strong>Price:</strong> {booking.price}</p>
                        <p><strong>Days Left:</strong> {booking.daysLeft} days</p>
                      </div>
                      
                      <div className="booking-actions">
                        <button className="action-btn primary">View Details</button>
                        <button className="action-btn secondary">Message Artist</button>
                        <button className="action-btn warning">Reschedule</button>
                      </div>
                    </div>
                    
                    <div className="payment-status">
                      <div className="payment-item">
                        <span className="payment-icon">✅</span>
                        <span>Deposit Paid</span>
                      </div>
                      <div className="payment-item">
                        <span className="payment-icon">⏰</span>
                        <span>Final Payment Due: {booking.finalPaymentDue}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Completed Bookings */}
            <div className="bookings-section">
              <h2 className="section-title">✅ Completed Bookings</h2>
              <div className="bookings-grid">
                {completedBookings.map(booking => (
                  <div key={booking.id} className="booking-card completed">
                    <div className="booking-header">
                      <h3 className="booking-title">{booking.title}</h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    
                    <div className="booking-details">
                      <div className="booking-info">
                        <p><strong>Artist:</strong> {booking.artist}</p>
                        <p><strong>Date & Time:</strong> {booking.date} · {booking.time}</p>
                        <p><strong>Location:</strong> {booking.location}</p>
                        <p><strong>Price:</strong> {booking.price}</p>
                      </div>
                      
                      <div className="booking-actions">
                        <button className="action-btn primary">View Details</button>
                        <button className="action-btn secondary">Write Review</button>
                        <button className="action-btn success">Book Again</button>
                      </div>
                    </div>
                    
                    <div className="payment-status">
                      <div className="payment-item">
                        <span className="payment-icon">✅</span>
                        <span>Fully Paid</span>
                      </div>
                      <div className="payment-item">
                        <span className="payment-icon">⭐</span>
                        <span>Review Available</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h2 className="section-title">🚀 Quick Actions</h2>
              <div className="actions-grid">
                <Link to="/booking" className="action-card">
                  <div className="action-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </div>
                  <h3>Book New Appointment</h3>
                  <p>Schedule a new mehndi session</p>
                </Link>
                
                <Link to="/dashboard" className="action-card">
                  <div className="action-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7"/>
                      <rect x="14" y="3" width="7" height="7"/>
                      <rect x="14" y="14" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/>
                    </svg>
                  </div>
                  <h3>Dashboard</h3>
                  <p>Return to main dashboard</p>
                </Link>
                
                <Link to="/messages" className="action-card">
                  <div className="action-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <h3>Messages</h3>
                  <p>Chat with artists</p>
                </Link>
              </div>
            </div>
        </div>
      </div>
    </>
  );
};

export default AllBookings;
