import React, { useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';
import api from '../services/api';

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.bookingsAPI.getAllBookings();
        setBookings(res.data || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="dashboard-layout">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="dashboard-main-content">
        <button
          className="sidebar-toggle-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="bookings-header">
          <h2 className="bookings-title">Manage Bookings</h2>
          <p className="bookings-subtitle">Manage all platform bookings</p>
        </div>

        {error && <p className="error">{error}</p>}
        {!loading && (
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
                <span className="stat-number">{bookings.length}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
              </div>
              <div className="stat-info">
                <h3>Confirmed</h3>
                <span className="stat-number">{bookings.filter(b => b.status === 'confirmed').length}</span>
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
                <h3>Pending</h3>
                <span className="stat-number">{bookings.filter(b => b.status === 'pending').length}</span>
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
                <span className="stat-number">{bookings.filter(b => b.status === 'completed').length}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <div className="stat-info">
                <h3>Cancelled</h3>
                <span className="stat-number">{bookings.filter(b => b.status === 'cancelled').length}</span>
              </div>
            </div>
          </div>
        )}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="table-responsive">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b._id}>
                    <td>{b.firstName} {b.lastName}</td>
                    <td>{(b.eventType && b.eventType.join(', ')) || b.otherEventType}</td>
                    <td>{new Date(b.eventDate).toLocaleDateString()}</td>
                    <td>£{b.minimumBudget} - £{b.maximumBudget}</td>
                    <td>{b.status}</td>
                    <td>
                      <button className="btn btn-outline" onClick={() => setSelected(b)}>View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selected && (
          <div className="modal-overlay" onClick={() => setSelected(null)}>
            <div className="payment-modal" onClick={(e)=>e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Booking Details</h2>
                <button className="modal-close" onClick={() => setSelected(null)}>×</button>
              </div>
              <div className="modal-body">
                <div className="details-grid">
                  <div className="detail-card">
                    <h3 className="modal-section-title">Client</h3>
                    <div className="detail-row"><span className="detail-label">Name</span><span className="detail-value">{selected.firstName} {selected.lastName}</span></div>
                    <div className="detail-row"><span className="detail-label">Email</span><span className="detail-value">{selected.email}</span></div>
                    <div className="detail-row"><span className="detail-label">Phone</span><span className="detail-value">{selected.phoneNumber}</span></div>
                  </div>
                  <div className="detail-card">
                    <h3 className="modal-section-title">Event</h3>
                    <div className="detail-row"><span className="detail-label">Type</span><span className="detail-value">{(selected.eventType && selected.eventType.join(', ')) || selected.otherEventType}</span></div>
                    <div className="detail-row"><span className="detail-label">Date</span><span className="detail-value">{selected.eventDate ? new Date(selected.eventDate).toLocaleDateString() : ''}</span></div>
                    <div className="detail-row"><span className="detail-label">Time</span><span className="detail-value">{(selected.preferredTimeSlot && selected.preferredTimeSlot.join(', '))}</span></div>
                  </div>
                  <div className="detail-card">
                    <h3 className="modal-section-title">Budget</h3>
                    <div className="badges">
                      <span className="badge">Min £{selected.minimumBudget}</span>
                      <span className="badge outline">Max £{selected.maximumBudget}</span>
                    </div>
                  </div>
                  <div className="detail-card">
                    <h3 className="modal-section-title">Location</h3>
                    <div className="detail-row"><span className="detail-label">City</span><span className="detail-value">{selected.city}</span></div>
                    <div className="detail-row"><span className="detail-label">Address</span><span className="detail-value">{selected.fullAddress}</span></div>
                  </div>
                </div>
                <div className="status-row">
                  <span className="detail-label">Status</span>
                  <span className={`status-badge ${selected.status}`}>{selected.status}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      </div>
      </div>
    </div>
  );
};

export default ManageBookings;


