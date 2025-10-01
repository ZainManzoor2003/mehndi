import React, { useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { adminAPI } from '../services/api';

const ManageApplications = () => {
  const [stats, setStats] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [summary, all] = await Promise.all([
          adminAPI.getApplicationStatusSummary(),
          adminAPI.getAllApplications()
        ]);
        setStats(summary.data || []);
        setApplications(all.data || []);
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
          <h2 className="bookings-title">Manage Applications</h2>
          <p className="bookings-subtitle">Review and manage artist applications</p>
        </div>

        {error && <p className="error">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {/* Application Stats Cards */}
            <div className="booking-stats">
              <div className="stat-card">
                <div className="stat-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                </div>
                <div className="stat-info">
                  <h3>Total Applications</h3>
                  <span className="stat-number">{applications.length}</span>
                </div>
              </div>

              {stats.map(s => {
                // Define icon based on status
                let icon;
                if (s.status === 'pending') {
                  icon = (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                  );
                } else if (s.status === 'approved') {
                  icon = (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22,4 12,14.01 9,11.01"/>
                    </svg>
                  );
                } else if (s.status === 'rejected') {
                  icon = (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                  );
                } else {
                  icon = (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  );
                }

                return (
                  <div key={s.status} className="stat-card">
                    <div className="stat-icon">
                      {icon}
                    </div>
                    <div className="stat-info">
                      <h3>{s.status.charAt(0).toUpperCase() + s.status.slice(1)}</h3>
                      <span className="stat-number">{s.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="table-responsive" style={{ marginTop: '1rem' }}>
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>Artist</th>
                    <th>Status</th>
                    <th>Proposed Budget</th>
                    <th>Booking Budget</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(a => (
                    <tr key={a.applicationId}>
                      <td>{a.artist?.firstName} {a.artist?.lastName}</td>
                      <td>{a.status}</td>
                      <td>£{a.proposedBudget}</td>
                      <td>£{a.booking?.budgetMin} - £{a.booking?.budgetMax}</td>
                      <td>
                        <button className="btn btn-outline" onClick={() => setSelected(a)}>View Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selected && (
              <div className="modal-overlay" onClick={() => setSelected(null)}>
                <div className="payment-modal" onClick={(e)=>e.stopPropagation()}>
                  <div className="modal-header">
                    <h2 className="modal-title">Application Details</h2>
                    <button className="modal-close" onClick={() => setSelected(null)}>×</button>
                  </div>
                  <div className="modal-body">
                    <div className="details-grid">
                      <div className="detail-card">
                        <h3 className="modal-section-title">Artist</h3>
                        <div className="detail-row">
                          <span className="detail-label">Name</span>
                          <span className="detail-value">{selected.artist?.firstName} {selected.artist?.lastName}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Email</span>
                          <span className="detail-value">{selected.artist?.email}</span>
                        </div>
                      </div>

                      <div className="detail-card">
                        <h3 className="modal-section-title">Client/Booking</h3>
                        <div className="detail-row">
                          <span className="detail-label">Client</span>
                          <span className="detail-value">{selected.booking?.client?.firstName} {selected.booking?.client?.lastName}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Email</span>
                          <span className="detail-value">{selected.booking?.client?.email}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Event</span>
                          <span className="detail-value">{selected.booking?.title || '—'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Date</span>
                          <span className="detail-value">{selected.booking?.eventDate ? new Date(selected.booking.eventDate).toLocaleDateString() : ''}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Location</span>
                          <span className="detail-value">{selected.booking?.location}</span>
                        </div>
                      </div>

                      <div className="detail-card">
                        <h3 className="modal-section-title">Financials</h3>
                        <div className="badges">
                          <span className="badge">Proposed £{selected.proposedBudget}</span>
                          <span className="badge outline">Budget £{selected.booking?.budgetMin} – £{selected.booking?.budgetMax}</span>
                        </div>
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
          </>
        )}
      </div>
      </div>
      </div>
    </div>
  );
};

export default ManageApplications;


