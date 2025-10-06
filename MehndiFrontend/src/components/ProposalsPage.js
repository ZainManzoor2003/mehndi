import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService, { chatAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

// Header removed for standalone use inside dashboard and route

const { bookingsAPI, applicationsAPI, paymentsAPI } = apiService;

const ProposalsPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('date');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedArtistDetails, setSelectedArtistDetails] = useState(null);
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
        const myBookings = (res.data || []).filter(b => b.status==='in_progress');
        setBookings(myBookings);
        console.log('bookings',myBookings)
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
        console.log('applicaions for bookings',Object.fromEntries(entries))
      } catch (e) {
        setError(e.message || 'Failed to load proposals');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Handle Stripe redirect success/cancel
  // useEffect(() => {
  //   const params = new URLSearchParams(window.location.search);
  //   const checkout = params.get('checkout');
  //   const bookingId = params.get('bookingId');
  //   const applicationId = params.get('applicationId');
  //   const paidAmountParam = params.get('paidAmount');
  //   const remainingParam = params.get('remaining');
  //   const isPaidParam = params.get('isPaid');
    
  //   console.log('Frontend - URL params:', {
  //     checkout,
  //     bookingId,
  //     applicationId,
  //     paidAmountParam,
  //     remainingParam,
  //     isPaidParam
  //   });
  //   if (checkout === 'success' && bookingId && applicationId) {
  //     const finalize = async () => {
  //       try {
  //         const paidAmountNum = Number(paidAmountParam || 0) || 0;
  //         const remainingNum = Number(remainingParam || 0) || 0;
  //         const isPaidValue = isPaidParam || 'none';
  //         await applicationsAPI.updateApplicationStatus(
  //           applicationId,
  //           bookingId,
  //           'accepted',
  //           { paymentPaid: paidAmountNum, remainingPayment: remainingNum, isPaid: isPaidValue }
  //         );
  //       } catch (e) {
  //       } finally {
  //         // Clean URL
  //         const url = new URL(window.location.href);
  //         url.search = '';
  //         window.history.replaceState({}, document.title, url.toString());
  //         // Reload lists
  //         if (!isAuthenticated) return;
  //         try {
  //           setLoading(true);
  //           setError('');
  //           const res = await bookingsAPI.getMyBookings();
  //           const myBookings = (res.data || []).filter(b => b.status === 'pending');
  //           setBookings(myBookings);
  //           if (myBookings.length && !expandedRequest) setExpandedRequest(myBookings[0]._id);
  //           const entries = await Promise.all(
  //             myBookings.map(async (b) => {
  //               try {
  //                 const r = await applicationsAPI.getApplicationsForBooking(b._id);
  //                 return [b._id, r.data || []];
  //               } catch (e) {
  //                 return [b._id, []];
  //               }
  //             })
  //           );
  //           setApplicationsByBooking(Object.fromEntries(entries));
  //         } catch (e) {
  //           setError(e.message || 'Failed to load proposals');
  //         } finally {
  //           setLoading(false);
  //         }
  //       }
  //     };
  //     finalize();
  //   }
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [isAuthenticated]);


  const handleAccept = (row) => {
    setSelectedRow(row);
    console.log('row',row)
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
      // Compute payment amounts based on 14-day rule from event date and proposed budget
      const request = bookings.find(b => b._id === selectedRow.bookingId);
      const eventDate = request?.eventDate ? new Date(request.eventDate) : null;
      const now = new Date();
      const diffDays = eventDate ? Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24)) : 0;
      const proposed = Number(selectedRow?.artistDetails?.proposedBudget) || 0;
      
      // Check if booking is already half paid - if so, use artist's proposed budget as full amount
      let paidAmount, remainingAmount, isPaid;
      
      if (selectedRow.bookingDetails?.isPaid === 'half') {
        // Booking is already half paid, use artist's proposed budget as the full amount
        paidAmount = proposed;
        remainingAmount = 0;
        isPaid = 'full';
      } else {
        // Regular logic based on 14-day rule
        const percent = diffDays >= 14 ? 0.5 : 1;
        paidAmount = Math.round(proposed * percent);
        remainingAmount = Math.max(proposed - paidAmount, 0);
        isPaid = diffDays >= 14 ? 'half' : 'full';
      }

      // Create Stripe Checkout session for paidAmount
      const successUrl = `${window.location.origin}?checkout=success&bookingId=${encodeURIComponent(selectedRow.bookingId)}
      &applicationId=${encodeURIComponent(selectedRow.applicationId)}&paidAmount=${encodeURIComponent(paidAmount)}
      &remaining=${encodeURIComponent(remainingAmount)}&isPaid=${encodeURIComponent(isPaid)}`;
      const cancelUrl = `${window.location.origin}?checkout=canceled&bookingId=${encodeURIComponent(selectedRow.bookingId)}&applicationId=${encodeURIComponent(selectedRow.applicationId)}`;

      console.log('Frontend - Sending isPaid:', isPaid);
      console.log('Frontend - Success URL:', successUrl);
      
      const checkout = await paymentsAPI.createCheckout({
        amount: paidAmount,
        remainingAmount,
        currency: 'gbp',
        bookingId: selectedRow.bookingId,
        applicationId: selectedRow.applicationId,
        successUrl,
        cancelUrl,
        description: 'Upfront payment to confirm booking',
        isPaid: isPaid,
      });

      if (checkout?.data?.url) {
        window.location.href = checkout.data.url;
        return; // Redirecting, stop further flow
      }
      
      
    } catch (e) {
    } finally {
      setShowAcceptModal(false);
      setSelectedRow(null);
    }
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
    if (!isAuthenticated) return;
      try {
        setLoading(true);
        setError('');
        const res = await bookingsAPI.getMyBookings();
        const myBookings = (res.data || []).filter(b => b.status === 'in_progress');
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

  const handleViewDetails = (row) => {
    setSelectedArtistDetails(row);
    setShowDetailsModal(true);
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
          <button className="view-details-btn" onClick={() => handleViewDetails(row)}>
            View Details
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
          <button className="view-details-btn" onClick={() => handleViewDetails(row)}>
            View Details
          </button>
        </div>
      );
    }
  };

  // Filter bookings based on search term
  const filteredBookings = useMemo(() => {
    if (!searchTerm.trim()) return bookings;
    
    const searchLower = searchTerm.toLowerCase();
    return bookings.filter(booking => {
      // Search by event type
      const eventTypeMatch = booking.eventType?.some(type => 
        type.toLowerCase().includes(searchLower)
      ) || false;
      
      // Search by location/city
      const locationMatch = (booking.city || booking.location || '')
        .toLowerCase().includes(searchLower);
      
      // Search by artist name in proposals
      const hasArtistMatch = applicationsByBooking[booking._id]?.some(app => {
        const artistName = `${app.artist?.firstName || ''} ${app.artist?.lastName || ''}`.toLowerCase();
        return artistName.includes(searchLower);
      }) || false;
      
      return eventTypeMatch || locationMatch || hasArtistMatch;
    });
  }, [bookings, searchTerm, applicationsByBooking]);

  // Calculate total number of bookings
  const totalBookings = filteredBookings.length;

  return (
    <>
      <div className="proposals-page">
        {/* Search Bar */}
        <div className="proposals-filters">
          <div className="filter-controls">
            <div className="search-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <input 
                type="text" 
                placeholder="Search by event type, location, or artist name" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="booking-count">
              Total Bookings: {totalBookings}
            </div>
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
          {filteredBookings.map(request => {
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

        {/* Artist Details Modal */}
        {showDetailsModal && selectedArtistDetails && (
          <div className="modal-overlay">
            <div className="artist-details-modal">
              <div className="modal-header">
                <h3 className="modal-title">Artist Details</h3>
                <button 
                  className="close-modal-btn"
                  onClick={() => setShowDetailsModal(false)}
                >
                  ✕
                </button>
              </div>
              
              <div className="artist-details-content">
                <div className="artist-profile-section">
                  <div className="artist-avatar-large">
                    {(selectedArtistDetails.artist?.firstName?.[0] || 'A')}{(selectedArtistDetails.artist?.lastName?.[0] || '')}
                  </div>
                  <div className="artist-basic-info">
                    <h4 className="artist-name">
                      {selectedArtistDetails.artist ? 
                        `${selectedArtistDetails.artist.firstName} ${selectedArtistDetails.artist.lastName}` : 
                        'Artist'
                      }
                    </h4>
                    <div className="artist-rating">
                      <span className="rating">⭐ {selectedArtistDetails.artist?.rating || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="artist-details-grid">
                  <div className="detail-section">
                    <h5>Proposal Details</h5>
                    <div className="detail-item">
                      <span className="detail-label">Proposed Budget:</span>
                      <span className="detail-value">£{selectedArtistDetails.artistDetails?.proposedBudget || '—'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Estimated Duration:</span>
                      <span className="detail-value">
                        {selectedArtistDetails.artistDetails?.estimatedDuration?.value || '—'} 
                        {selectedArtistDetails.artistDetails?.estimatedDuration?.unit || ' hours'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Message:</span>
                      <span className="detail-value long-text">{selectedArtistDetails.artistDetails?.proposal?.message || 'No message provided'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Additional Notes:</span>
                      <span className="detail-value long-text">{selectedArtistDetails.artistDetails?.proposal?.additionalNotes || 'No additional notes'}</span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h5>Availability</h5>
                    <div className="detail-item">
                      <span className="detail-label">Can Travel to Location:</span>
                      <span className="detail-value">
                        {selectedArtistDetails.artistDetails?.availability?.canTravelToLocation ? '✅ Yes' : '❌ No'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Available on Date:</span>
                      <span className="detail-value">
                        {selectedArtistDetails.artistDetails?.availability?.isAvailableOnDate ? '✅ Yes' : '❌ No'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Flexible Schedule:</span>
                      <span className="detail-value">
                        {selectedArtistDetails.artistDetails?.availability?.flexibleSchedule ? '✅ Yes' : '❌ No'}
                      </span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h5>Experience & Portfolio</h5>
                    <div className="detail-item">
                      <span className="detail-label">Portfolio Highlights:</span>
                      <span className="detail-value long-text">{selectedArtistDetails.artistDetails?.experience?.portfolioHighlights || 'Not provided'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Relevant Experience:</span>
                      <span className="detail-value long-text">{selectedArtistDetails.artistDetails?.experience?.relevantExperience || 'Not provided'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Years of Experience:</span>
                      <span className="detail-value">{selectedArtistDetails.artistDetails?.experience?.yearsOfExperience || 'Not specified'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Specializations:</span>
                      <span className="detail-value">{selectedArtistDetails.artistDetails?.experience?.specializations || 'Not specified'}</span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h5>Terms & Conditions</h5>
                    <div className="detail-item">
                      <span className="detail-label">Agreed to Terms:</span>
                      <span className="detail-value">
                        {selectedArtistDetails.artistDetails?.terms?.agreedToTerms ? '✅ Yes' : '❌ No'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Payment Terms:</span>
                      <span className="detail-value">{selectedArtistDetails.artistDetails?.terms?.paymentTerms || 'Not specified'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Cancellation Policy:</span>
                      <span className="detail-value">{selectedArtistDetails.artistDetails?.terms?.cancellationPolicy || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
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