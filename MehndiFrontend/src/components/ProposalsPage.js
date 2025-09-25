import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService, { chatAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

// Header removed for standalone use inside dashboard and route

const { bookingsAPI, applicationsAPI } = apiService;

const ProposalsPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('active');
  const [sortBy, setSortBy] = useState('date');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [expandedRequest, setExpandedRequest] = useState(null);

  // Live data
  const [bookings, setBookings] = useState([]); // pending bookings only
  const [applicationsByBooking, setApplicationsByBooking] = useState({}); // { bookingId: Application[] }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated) return;
      try {
        setLoading(true);
        setError('');
        const res = await bookingsAPI.getMyBookings();
        const myBookings = (res.data || []).filter(b => b.status === 'pending');
        setBookings(myBookings);
        // default expand first
        if (myBookings.length && !expandedRequest) setExpandedRequest(myBookings[0]._id);
        // fetch applications per booking in parallel
        const entries = await Promise.all(
          myBookings.map(async (b) => {
            try {
              const r = await applicationsAPI.getApplicationsForBooking(b._id);
              return [b._id, r.data || []];
            } catch (e) {
              return [b._id, []];
            }
          })
        );
        setApplicationsByBooking(Object.fromEntries(entries));
      } catch (e) {
        setError(e.message || 'Failed to load proposals');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const handleAccept = (row) => {
    setSelectedRow(row);
    setShowAcceptModal(true);
  };

  const handleDecline = (row) => {
    setSelectedRow(row);
    setShowDeclineModal(true);
  };

  const updateRowStatus = (bookingId, applicationId, status) => {
    setApplicationsByBooking(prev => {
      const copy = { ...prev };
      const list = (copy[bookingId] || []).map(a => a.applicationId === applicationId ? { ...a, status } : a);
      copy[bookingId] = list;
      return copy;
    });
  };

  const handleConfirmAccept = async () => {
    if (!selectedRow) return;
    try {
      await applicationsAPI.updateApplicationStatus(selectedRow.applicationId, selectedRow.bookingId, 'accepted');
      // server returns refreshed list; refetch this booking
      const refreshed = await applicationsAPI.getApplicationsForBooking(selectedRow.bookingId);
      setApplicationsByBooking(prev => ({ ...prev, [selectedRow.bookingId]: refreshed.data || [] }));
    } catch (e) {
      // optimistic update fallback
      updateRowStatus(selectedRow.bookingId, selectedRow.applicationId, 'accepted');
    } finally {
      setShowAcceptModal(false);
      setSelectedRow(null);
    }
  };

  const handleConfirmDecline = async () => {
    if (!selectedRow) return;
    try {
      await applicationsAPI.updateApplicationStatus(selectedRow.applicationId, selectedRow.bookingId, 'declined');
      updateRowStatus(selectedRow.bookingId, selectedRow.applicationId, 'declined');
    } catch (e) {
    } finally {
      setShowDeclineModal(false);
      setSelectedRow(null);
    }
  };

  const handleToggleExpanded = (requestId) => {
    setExpandedRequest(expandedRequest === requestId ? null : requestId);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'applied':
        return <span className="status-badge pending">⏰ Pending</span>;
      case 'accepted':
        return <span className="status-badge accepted">✅ Accepted</span>;
      case 'declined':
        return <span className="status-badge declined">❌ Declined</span>;
      default:
        return <span className="status-badge pending">⏰ Pending</span>;
    }
  };

  const handleMessageArtist = async (row) => {
    try {
      if (!user || !user._id) return;
      const clientId = user._id;
      const artistId = row.artist?._id || row.artistId;
      if (!artistId) return;
      const res = await chatAPI.ensureChat(clientId, artistId);
      if (res.success && res.data && res.data._id) {
        navigate(`/dashboard/messages?chatId=${res.data._id}`);
      }
    } catch (e) {
      console.error('Failed to ensure chat:', e);
    }
  };

  const getActionButtons = (row) => {
    if (row.status === 'applied') {
      return (
        <div className="proposal-actions">
          <button 
            className="accept-btn"
            onClick={() => handleAccept(row)}
          >
            Accept
          </button>
          <button 
            className="decline-btn"
            onClick={() => handleDecline(row)}
          >
            Decline
          </button>
          <button className="message-btn" onClick={() => handleMessageArtist(row)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      );
    } else {
      return (
        <div className="proposal-actions">
          <button className="message-btn" onClick={() => handleMessageArtist(row)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      );
    }
  };

  return (
    <>
      <div className="proposals-page">
        {/* Filter Tabs */}
        <div className="proposals-filters">
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              All Requests ({bookings.length})
            </button>
            <button 
              className={`filter-tab ${activeFilter === 'active' ? 'active' : ''}`}
              onClick={() => handleFilterChange('active')}
            >
              Active ({bookings.length})
            </button>
            <button 
              className={`filter-tab ${activeFilter === 'completed' ? 'active' : ''}`}
              onClick={() => handleFilterChange('completed')}
            >
              Completed (0)
            </button>
          </div>

          {/* Search and Filter Controls */}
          <div className="filter-controls">
            <div className="search-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <input 
                type="text" 
                placeholder="Search requests" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="filters-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              Filters
            </button>
          </div>
        </div>

        {/* Requests List */}
        <div className="requests-container">
          {error && (
            <div className="error-text">{error}</div>
          )}
          {loading && (
            <div className="loading-text">Loading...</div>
          )}
          {bookings.map(request => {
            const proposals = applicationsByBooking[request._id] || [];
            const appliedOnly = proposals.filter(p => p.status === 'applied');
            const proposalCount = appliedOnly.length;
            const title = `${request.eventType?.join(', ') || 'Mehndi'} — ${request.city || request.location}`;
            const date = request.eventDate ? new Date(request.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
            return (
            <div key={request._id} className="request-section">
              {/* Request Header */}
              <div className="request-header">
                <div className="request-info">
                  <h3 className="request-title">{title}</h3>
                  <p className="request-details">{request.city || request.location} • {date}</p>
                </div>
                <div className="request-controls">
                  <span className="status-badge open">Open</span>
                  <span className="proposal-count">{proposalCount} proposal{proposalCount !== 1 ? 's' : ''}</span>
                  <button 
                    className="expand-toggle"
                    onClick={() => handleToggleExpanded(request._id)}
                  >
                    {expandedRequest === request._id ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="2" fill="none"/>
                        </svg>
                        Collapse
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" fill="none"/>
                        </svg>
                        Expand
                      </>
                    )}
                  </button>
                  <button className="edit-btn">✏️</button>
                  <button className="close-btn">✕</button>
                </div>
              </div>

              {/* Expanded Proposals Table */}
              {expandedRequest === request._id && (
                <div className="proposals-table-section">
                  <div className="proposals-header">
                    <h4>Recent Proposals</h4>
                    <div className="sort-controls">
                      <span>Sort</span>
                      <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        className="sort-select"
                      >
                        <option value="date">Date</option>
                        <option value="price">Price</option>
                        <option value="rating">Rating</option>
                      </select>
                    </div>
                  </div>

                   <div className="proposals-table">
                    <div className="table-header">
                      <span className="col-artist">Artist</span>
                      <span className="col-price">Price/Time</span>
                      <span className="col-status">Status</span>
                      <span className="col-actions">Actions</span>
                    </div>

                    {appliedOnly.map(app => (
                      <div key={app.applicationId} className="table-row">
                        <div className="col-artist">
                          <div className="artist-info">
                            <div className="artist-avatar">
                              {(app.artist?.firstName?.[0] || 'A')}{(app.artist?.lastName?.[0] || '')}
                            </div>
                            <div className="artist-details">
                              <span className="artist-name">{app.artist ? `${app.artist.firstName} ${app.artist.lastName}` : 'Artist'}</span>
                              <div className="artist-meta">
                                <span className="rating">⭐ {app.artist?.rating || '—'}</span>
                                <span className="location">• {request.city || request.location}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-price">
                          <span className="price">£{app.artistDetails?.proposedBudget || '—'}</span>
                          <span className="time">{app.artistDetails?.estimatedDuration?.value || '—'} {app.artistDetails?.estimatedDuration?.unit || 'hours'}</span>
                        </div>
                        <div className="col-status">
                          {getStatusBadge(app.status)}
                        </div>
                        <div className="col-actions">
                          {getActionButtons(app)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );})}
        </div>

        {/* Accept Modal */}
        {showAcceptModal && (
          <div className="modal-overlay">
            <div className="confirmation-modal">
              <h3 className="modal-title">Accept Proposal?</h3>
              <p className="modal-text">
                This will confirm the booking and decline all other proposals for this request.
              </p>
              <div className="modal-actions">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowAcceptModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="confirm-btn"
                  onClick={handleConfirmAccept}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Decline Modal */}
        {showDeclineModal && (
          <div className="modal-overlay">
            <div className="confirmation-modal">
              <h3 className="modal-title">Decline Proposal?</h3>
              <p className="modal-text">
                This proposal will be marked as declined. You can't undo this action.
              </p>
              <div className="modal-actions">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowDeclineModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="confirm-btn decline"
                  onClick={handleConfirmDecline}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProposalsPage; 