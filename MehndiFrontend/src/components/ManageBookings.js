import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminSidebar from './AdminSidebar';
import api from '../services/api';
import Select from 'react-select';
import './admin-styles.css';

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedBookingForLogs, setSelectedBookingForLogs] = useState(null);
  const [bookingLogs, setBookingLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedEventType, setSelectedEventType] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedUserType, setSelectedUserType] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [paginatedBookings, setPaginatedBookings] = useState([]);
  const [selectedItemsPerPage, setSelectedItemsPerPage] = useState({ value: 15, label: '15 per page' });
  const [hoverId, setHoverId] = useState(null);

  // Status options
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Assigned' },
    { value: 'in_progress', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'expired', label: 'Expired' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // Event Type options
  const eventTypeOptions = [
    { value: '', label: 'All Event Types' },
    { value: 'Wedding', label: 'Wedding' },
    { value: 'Festival', label: 'Festival' },
    { value: 'Eid', label: 'Eid' },
    { value: 'Party', label: 'Party' },
    { value: 'Other', label: 'Other' }
  ];

  // UK Cities options
  const cityOptions = [
    { value: '', label: 'All Cities' },
    { value: 'London', label: 'London' },
    { value: 'Birmingham', label: 'Birmingham' },
    { value: 'Manchester', label: 'Manchester' },
    { value: 'Bradford', label: 'Bradford' }
  ];


  // Items per page options
  const itemsPerPageOptions = [
    { value: 5, label: '5 per page' },
    { value: 15, label: '15 per page' },
    { value: 30, label: '30 per page' }
  ];

  // Filter bookings based on search term, status, and event type
  useEffect(() => {
    let filtered = bookings;

    // Filter by search term (client name, event type, budget, etc.)
    if (searchTerm) {
      filtered = filtered.filter(booking => {
        const searchLower = searchTerm.toLowerCase();
        const fullId = String(booking._id || '').toLowerCase();
        const displayId = formatDisplayId('REQ', booking._id || '').toLowerCase();
        return (
          booking.firstName?.toLowerCase().includes(searchLower) ||
          booking.lastName?.toLowerCase().includes(searchLower) ||
          booking.email?.toLowerCase().includes(searchLower) ||
          booking.otherEventType?.toLowerCase().includes(searchLower) ||
          booking.eventType?.join(', ').toLowerCase().includes(searchLower) ||
          booking.minimumBudget?.toString().includes(searchTerm) ||
          booking.maximumBudget?.toString().includes(searchTerm) ||
          booking.location?.toLowerCase().includes(searchLower) ||
          booking.fullAddress?.toLowerCase().includes(searchLower) ||
          fullId.includes(searchLower) ||
          displayId.includes(searchLower)
        );
      });
    }

    // Filter by status
    if (selectedStatus?.value) {
      filtered = filtered.filter(booking => booking.status === selectedStatus.value);
    }

    // Filter by event type
    if (selectedEventType?.value) {
      filtered = filtered.filter(booking => 
        booking.eventType?.includes(selectedEventType.value) || 
        booking.otherEventType?.toLowerCase().includes(selectedEventType.value.toLowerCase())
      );
    }

    // Filter by city
    if (selectedCity?.value) {
      filtered = filtered.filter(booking => 
        booking.location?.toLowerCase().includes(selectedCity.value.toLowerCase()) ||
        booking.fullAddress?.toLowerCase().includes(selectedCity.value.toLowerCase())
      );
    }

    // Filter by user type (client type)
    if (selectedUserType?.value) {
      filtered = filtered.filter(booking => 
        booking.userType === selectedUserType.value
      );
    }

    setFilteredBookings(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [bookings, searchTerm, selectedStatus, selectedEventType, selectedCity, selectedUserType]);

  // Pagination logic
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedBookings(filteredBookings.slice(startIndex, endIndex));
  }, [filteredBookings, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (option) => {
    setItemsPerPage(option.value);
    setSelectedItemsPerPage(option);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Generate page numbers array
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

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

  const getLast5Digits = (id) => {
    if (!id) return '00000';
    let digits = '';
    for (let i = id.length - 1; i >= 0 && digits.length < 5; i--) {
      if (/\d/.test(id[i])) digits = id[i] + digits;
    }
    return digits.padStart(5, '0');
  };
  const formatDisplayId = (prefix, id) => `${prefix}-${getLast5Digits(id)}`;
  const copyFullId = async (e, id) => {
    e?.stopPropagation?.();
    try { await navigator.clipboard.writeText(String(id)); } catch (err) {
      try {
        const ta = document.createElement('textarea');
        ta.value = String(id);
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {}
    }
  };

  return (
    <div className="admin_dashboard-layout">
      <ToastContainer position="top-right" autoClose={2000} />
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="admin_dashboard-main-content">
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
      <div className="admin_dashboard-container">
      <div className="admin_dashboard-content">
        <div className="admin_bookings-header">
          <h2 className="admin_bookings-title">Manage Bookings</h2>
          <p className="admin_bookings-subtitle">Manage all platform bookings</p>
        </div>

        {error && <p className="admin_error">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {/* Booking Stats Cards */}
          <div className="admin_booking-stats">
            <div className="admin_stat-card">
              <div className="admin_stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <div className="admin_stat-info">
                <h3>Total Bookings</h3>
                <span className="admin_stat-number">{bookings.length}</span>
              </div>
            </div>

            <div className="admin_stat-card">
              <div className="admin_stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
              </div>
              <div className="admin_stat-info">
                <h3>Confirmed</h3>
                <span className="admin_stat-number">{bookings.filter(b => b.status === 'confirmed').length}</span>
              </div>
            </div>

            <div className="admin_stat-card">
              <div className="admin_stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
              </div>
              <div className="admin_stat-info">
                <h3>Pending</h3>
                <span className="admin_stat-number">{bookings.filter(b => b.status === 'pending').length}</span>
              </div>
            </div>

            <div className="admin_stat-card">
              <div className="admin_stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              </div>
              <div className="admin_stat-info">
                <h3>Completed</h3>
                <span className="admin_stat-number">{bookings.filter(b => b.status === 'completed').length}</span>
              </div>
            </div>

          </div>
          {/* Filter Section */}
          <div className="admin_filter-section">
              <div style={{
                display: 'grid',
                gridTemplateColumns: (searchTerm || selectedStatus?.value || selectedEventType?.value || selectedCity?.value) ? '1fr 1fr 1fr 1fr auto' : '1fr 1fr 1fr 1fr',
                gap: '1rem',
                alignItems: 'end'
              }}>
                {/* Search Input */}
                <div className="admin_filter-item">
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#0f172a',
                    fontSize: '0.875rem'
                  }}>
                    Search Bookings
                  </label>
                  <input
                    type="text"
                    placeholder="Search by client, event, budget..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      transition: 'border-color 0.2s',
                      backgroundColor: '#ffffff'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Status Dropdown */}
                <div className="admin_filter-item">
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#0f172a',
                    fontSize: '0.875rem'
                  }}>
                    Filter by Status
                  </label>
                  <Select
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    options={statusOptions}
                    placeholder="All Statuses"
                    styles={{
                      control: (provided, state) => ({
                        ...provided,
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        minHeight: '42px',
                        backgroundColor: '#ffffff',
                        boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
                        '&:hover': {
                          borderColor: '#3b82f6'
                        },
                        ...(state.isFocused && {
                          borderColor: '#3b82f6'
                        }),
                        ...(state.isFocused && {
                          borderColor: '#3b82f6',
                          backgroundColor: '#ffffff'
                        })
                      }),
                      placeholder: (provided) => ({
                        ...provided,
                        color: '#6b7280',
                        fontSize: '0.875rem'
                      }),
                      option: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isSelected ? '#6b7280' : state.isFocused ? '#f8fafc' : '#ffffff',
                        color: state.isSelected ? '#ffffff' : '#0f172a',
                        fontSize: '0.875rem'
                      }),
                      singleValue: (provided) => ({
                        ...provided,
                        color: '#0f172a',
                        fontSize: '0.875rem'
                      })
                    }}
                  />
                </div>

                {/* Event Type Dropdown */}
                <div className="admin_filter-item">
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#0f172a',
                    fontSize: '0.875rem'
                  }}>
                    Filter by Event Type
                  </label>
                  <Select
                    value={selectedEventType}
                    onChange={setSelectedEventType}
                    options={eventTypeOptions}
                    placeholder="All Event Types"
                    styles={{
                      control: (provided, state) => ({
                        ...provided,
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        minHeight: '42px',
                        backgroundColor: '#ffffff',
                        boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
                        '&:hover': {
                          borderColor: '#3b82f6'
                        },
                        ...(state.isFocused && {
                          borderColor: '#3b82f6'
                        }),
                        ...(state.isFocused && {
                          borderColor: '#3b82f6',
                          backgroundColor: '#ffffff'
                        })
                      }),
                      placeholder: (provided) => ({
                        ...provided,
                        color: '#6b7280',
                        fontSize: '0.875rem'
                      }),
                      option: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isSelected ? '#6b7280' : state.isFocused ? '#f8fafc' : '#ffffff',
                        color: state.isSelected ? '#ffffff' : '#0f172a',
                        fontSize: '0.875rem'
                      }),
                      singleValue: (provided) => ({
                        ...provided,
                        color: '#0f172a',
                        fontSize: '0.875rem'
                      })
                    }}
                  />
                </div>

                {/* City Dropdown */}
                <div className="admin_filter-item">
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#0f172a',
                    fontSize: '0.875rem'
                  }}>
                    Filter by City
                  </label>
                  <Select
                    value={selectedCity}
                    onChange={setSelectedCity}
                    options={cityOptions}
                    placeholder="All Cities"
                    styles={{
                      control: (provided, state) => ({
                        ...provided,
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        minHeight: '42px',
                        backgroundColor: '#ffffff',
                        boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
                        '&:hover': {
                          borderColor: '#3b82f6'
                        },
                        ...(state.isFocused && {
                          borderColor: '#3b82f6'
                        }),
                        ...(state.isFocused && {
                          borderColor: '#3b82f6',
                          backgroundColor: '#ffffff'
                        })
                      }),
                      placeholder: (provided) => ({
                        ...provided,
                        color: '#6b7280',
                        fontSize: '0.875rem'
                      }),
                      option: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isSelected ? '#6b7280' : state.isFocused ? '#f8fafc' : '#ffffff',
                        color: state.isSelected ? '#ffffff' : '#0f172a',
                        fontSize: '0.875rem'
                      }),
                      singleValue: (provided) => ({
                        ...provided,
                        color: '#0f172a',
                        fontSize: '0.875rem'
                      })
                    }}
                  />
                </div>

                {/* Clear Filters Button */}
                {(searchTerm || selectedStatus?.value || selectedEventType?.value || selectedCity?.value || selectedUserType?.value) && (
                  <div className="admin_filter-item" style={{ display: 'flex', alignItems: 'end' }}>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedStatus(null);
                        setSelectedEventType(null);
                        setSelectedCity(null);
                        setSelectedUserType(null);
                      }}
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: 'transparent',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        color: '#6b7280',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.color = '#3b82f6';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.color = '#6b7280';
                      }}
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="admin_table-responsive" style={{ marginTop: '1rem' }}>
              {paginatedBookings.length === 0 && filteredBookings.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" style={{ marginBottom: '1rem' }}>
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  <h3 style={{ color: '#6b7280', marginBottom: '0.5rem', fontSize: '1.125rem' }}>No bookings found</h3>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                    {searchTerm || selectedStatus?.value || selectedEventType?.value || selectedCity?.value || selectedUserType?.value
                      ? 'Try adjusting your filters to see more results.' 
                      : 'No bookings have been created yet.'}
                  </p>
                </div>
              ) : (
                <table className="admin_styled-table">
                  <thead>
                    <tr>
                      <th>Id</th>
                      <th>Client</th>
                      <th>Event</th>
                      <th>Date</th>
                      <th>Budget</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBookings.map(b => (
                      <tr key={b._id}>
                        <td onMouseEnter={() => setHoverId(b._id)} onMouseLeave={() => setHoverId(null)}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
                            <span style={{ fontWeight: 600 }}>{formatDisplayId('REQ', b._id)}</span>
                            {hoverId === b._id && (
                              <button
                                title="Copy Full ID"
                                onClick={(e) => { copyFullId(e, b._id); toast.success('ID copied successfully'); }}
                                style={{ position: 'absolute', bottom: '100%', left: 0, background: '#0b1220', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.70rem', padding: '6px 10px', borderRadius: 6, zIndex: 9999, boxShadow: '0 6px 16px rgba(0,0,0,0.18)' }}
                              >
                                Copy Full ID
                              </button>
                            )}
                          </div>
                        </td>
                        <td>{b.firstName} {b.lastName}</td>
                        <td>{(b.eventType && b.eventType.join(', ')) || b.otherEventType}</td>
                        <td>{new Date(b.eventDate).toLocaleDateString()}</td>
                        <td>£{b.minimumBudget} - £{b.maximumBudget}</td>
                        <td>
                          <span className={`admin_status-badge ${b.status}`}>
                            {b.status === 'pending' && 'Pending'}
                            {b.status === 'confirmed' && 'Assigned'}
                            {b.status === 'in_progress' && 'Active'}
                            {b.status === 'completed' && 'Completed'}
                            {b.status === 'expired' && 'Expired'}
                            {b.status === 'cancelled' && 'Cancelled'}
                          </span>
                        </td>
                        <td>
                          <button className="admin_btn admin_btn-outline" onClick={() => setSelected(b)}>View Details</button>
                        </td>
                        <td>
                          <button className="admin_btn admin_btn-outline" 
                          onClick={async () => {
                            setSelectedBookingForLogs(b);
                            setShowLogsModal(true);
                            setLogsLoading(true);
                            try {
                              const response = await api.bookingsAPI.getBookingLogs(b._id);
                              if (response.success) {
                                setBookingLogs(response.data || []);
                              } else {
                                toast.error('Failed to load booking logs');
                              }
                            } catch (error) {
                              console.error('Error fetching booking logs:', error);
                              toast.error('Failed to load booking logs');
                            } finally {
                              setLogsLoading(false);
                            }
                          }}>View Logs</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Component */}
            {filteredBookings.length > 0 && (
              <div className="admin_pagination-container" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '2rem',
                padding: '1rem 0',
                borderTop: '1px solid #e5e7eb'
              }}>
                {/* Items per page selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Show:</span>
                  <Select
                    value={selectedItemsPerPage}
                    onChange={handleItemsPerPageChange}
                    options={itemsPerPageOptions}
                    menuPlacement="top"
                    styles={{
                      control: (provided, state) => ({
                        ...provided,
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        minHeight: '36px',
                        width: '120px',
                        backgroundColor: '#ffffff',
                        boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
                        '&:hover': {
                          borderColor: '#3b82f6'
                        },
                        ...(state.isFocused && {
                          borderColor: '#3b82f6'
                        })
                      }),
                      placeholder: (provided) => ({
                        ...provided,
                        color: '#6b7280',
                        fontSize: '0.75rem'
                      }),
                      option: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isSelected ? '#6b7280' : state.isFocused ? '#f8fafc' : '#ffffff',
                        color: state.isSelected ? '#ffffff' : '#0f172a',
                        fontSize: '0.75rem'
                      }),
                      singleValue: (provided) => ({
                        ...provided,
                        color: '#0f172a',
                        fontSize: '0.75rem'
                      })
                    }}
                  />
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    of {filteredBookings.length} bookings
                  </span>
                </div>

                {/* Pagination controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {/* Previous button */}
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    style={{
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      backgroundColor: currentPage === 1 ? '#ffffff' : '#ffffff',
                      color: currentPage === 1 ? '#9ca3af' : '#0f172a',
                      fontSize: '0.875rem',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== 1) {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.color = '#3b82f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== 1) {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.color = '#0f172a';
                      }
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15,18 9,12 15,6"/>
                    </svg>
                    Previous
                  </button>

                  {/* Page numbers */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {getPageNumbers().map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        style={{
                          padding: '0.5rem 0.75rem',
                          border: `1px solid ${currentPage === pageNum ? '#3b82f6' : '#e5e7eb'}`,
                          borderRadius: '6px',
                          backgroundColor: currentPage === pageNum ? '#3b82f6' : '#ffffff',
                          color: currentPage === pageNum ? '#ffffff' : '#0f172a',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          minWidth: '40px'
                        }}
                        onMouseEnter={(e) => {
                          if (currentPage !== pageNum) {
                            e.target.style.borderColor = '#3b82f6';
                            e.target.style.backgroundColor = '#f8fafc';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (currentPage !== pageNum) {
                            e.target.style.borderColor = '#e5e7eb';
                            e.target.style.backgroundColor = '#ffffff';
                          }
                        }}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  {/* Next button */}
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      backgroundColor: currentPage === totalPages ? '#ffffff' : '#ffffff',
                      color: currentPage === totalPages ? '#9ca3af' : '#0f172a',
                      fontSize: '0.875rem',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== totalPages) {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.color = '#3b82f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== totalPages) {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.color = '#0f172a';
                      }
                    }}
                  >
                    Next
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9,18 15,12 9,6"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {selected && (
          <div className="admin_modal-overlay" onClick={() => setSelected(null)}>
            <div className="admin_payment-modal" onClick={(e)=>e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="admin_modal-header">
                <h2 className="admin_modal-title">Booking Details</h2>
                <button className="admin_modal-close" onClick={() => setSelected(null)}>×</button>
              </div>
              <div className="admin_modal-body">
                <div className="admin_details-grid">
                  <div className="admin_detail-card">
                    <h3 className="admin_modal-section-title">Client</h3>
                    <div className="admin_detail-row"><span className="admin_detail-label">Name</span><span className="admin_detail-value">{selected.firstName} {selected.lastName}</span></div>
                    <div className="admin_detail-row"><span className="admin_detail-label">Email</span><span className="admin_detail-value">{selected.email}</span></div>
                  </div>
                  <div className="admin_detail-card">
                    <h3 className="admin_modal-section-title">Event</h3>
                    <div className="admin_detail-row"><span className="admin_detail-label">Type</span><span className="admin_detail-value">{(selected.eventType && selected.eventType.join(', ')) || selected.otherEventType}</span></div>
                    <div className="admin_detail-row"><span className="admin_detail-label">Date</span><span className="admin_detail-value">{selected.eventDate ? new Date(selected.eventDate).toLocaleDateString() : ''}</span></div>
                    <div className="admin_detail-row"><span className="admin_detail-label">Time</span><span className="admin_detail-value">{(selected.preferredTimeSlot && selected.preferredTimeSlot.join(', '))}</span></div>
                  </div>
                  <div className="admin_detail-card">
                    <h3 className="admin_modal-section-title">Budget</h3>
                    <div className="admin_badges">
                      <span className="admin_badge">Min £{selected.minimumBudget}</span>
                      <span className="badge outline">Max £{selected.maximumBudget}</span>
                    </div>
                  </div>
                  <div className="admin_detail-card">
                    <h3 className="admin_modal-section-title">Location</h3>
                    <div className="admin_detail-row"><span className="admin_detail-label">City</span><span className="admin_detail-value">{selected.location}</span></div>
                  </div>
                </div>

                {/* Images Section */}
                {selected.images && selected.images.length > 0 && (
                  <div className="admin_detail-card" style={{ marginTop: '1.5rem' }}>
                    <h3 className="admin_modal-section-title">Uploaded Images</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px', marginTop: '10px' }}>
                      {selected.images.map((img, idx) => (
                        <div key={idx} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '2px solid #eab308' }}>
                          <img 
                            src={img} 
                            alt={`Upload ${idx + 1}`}
                            style={{ 
                              width: '100%', 
                              height: '150px', 
                              objectFit: 'cover',
                              cursor: 'pointer'
                            }}
                            onClick={() => window.open(img, '_blank')}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video Section */}
                {selected.video && (
                  <div className="admin_detail-card" style={{ marginTop: '1.5rem' }}>
                    <h3 className="admin_modal-section-title">Uploaded Video</h3>
                    <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #eab308' }}>
                      <video 
                        controls
                        style={{ 
                          width: '100%', 
                          maxHeight: '400px',
                          backgroundColor: '#000'
                        }}
                      >
                        <source src={selected.video} type="video/mp4" />
                        <source src={selected.video} type="video/webm" />
                        <source src={selected.video} type="video/ogg" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>
                )}

                    <div className="admin_status-row">
                      <span className="admin_detail-label">Status</span>
                      <span className={`admin_status-badge ${selected.status}`}>
                        {selected.status === 'pending' && 'Pending'}
                        {selected.status === 'confirmed' && 'Confirmed'}
                        {selected.status === 'in_progress' && 'In Progress'}
                        {selected.status === 'completed' && 'Completed'}
                        {selected.status === 'cancelled' && 'Cancelled'}
                      </span>
                    </div>
              </div>
            </div>
          </div>
        )}

      </div>
      </div>
      </div>

      {/* Booking Logs Modal */}
      {showLogsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }} onClick={() => setShowLogsModal(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f9fafb'
            }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#1f2937' }}>
                Booking Logs
              </h2>
              <button
                onClick={() => setShowLogsModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#e5e7eb';
                  e.target.style.color = '#1f2937';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#6b7280';
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{
              padding: '24px',
              overflowY: 'auto',
              flex: 1
            }}>
              {selectedBookingForLogs && (
                <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Booking ID</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
                    {formatDisplayId('REQ', selectedBookingForLogs._id)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                    {selectedBookingForLogs.firstName} {selectedBookingForLogs.lastName} - {selectedBookingForLogs.eventType?.join(', ')}
                  </div>
                </div>
              )}

              {logsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading logs...</div>
              ) : bookingLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>No logs found for this booking</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {bookingLogs.map((log, index) => {
                    const actionLabels = {
                      'booking_created': 'Booking Created',
                      'booking_updated': 'Booking Updated',
                      'booking_cancelled': 'Booking Cancelled',
                      'booking_deleted': 'Booking Deleted',
                      'booking_status_changed': 'Status Changed',
                      'artist_applied': 'Artist Applied',
                      'application_accepted': 'Application Accepted',
                      'application_declined': 'Application Declined',
                      'application_withdrawn': 'Application Withdrawn',
                      'application_cancelled': 'Application Cancelled',
                      'booking_completed': 'Booking Completed'
                    };

                    const actionColors = {
                      'booking_created': '#10b981',
                      'booking_updated': '#3b82f6',
                      'booking_cancelled': '#ef4444',
                      'booking_deleted': '#991b1b',
                      'booking_status_changed': '#8b5cf6',
                      'artist_applied': '#f59e0b',
                      'application_accepted': '#10b981',
                      'application_declined': '#ef4444',
                      'application_withdrawn': '#6b7280',
                      'application_cancelled': '#ef4444',
                      'booking_completed': '#10b981'
                    };

                    const date = new Date(log.createdAt);
                    const formattedDate = date.toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div
                        key={log._id || index}
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '16px',
                          backgroundColor: 'white',
                          position: 'relative',
                          paddingLeft: '48px'
                        }}
                      >
                        {/* Timeline dot */}
                        <div
                          style={{
                            position: 'absolute',
                            left: '16px',
                            top: '20px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: actionColors[log.action] || '#6b7280',
                            border: '2px solid white',
                            boxShadow: '0 0 0 2px ' + (actionColors[log.action] || '#6b7280')
                          }}
                        />
                        
                        {/* Timeline line */}
                        {index < bookingLogs.length - 1 && (
                          <div
                            style={{
                              position: 'absolute',
                              left: '21px',
                              top: '32px',
                              width: '2px',
                              height: 'calc(100% + 12px)',
                              backgroundColor: '#e5e7eb'
                            }}
                          />
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
                              {actionLabels[log.action] || log.action}
                            </div>
                            {log.performedBy?.name && (
                              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                                By: {log.performedBy.name} ({log.performedBy.userType})
                              </div>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#9ca3af', whiteSpace: 'nowrap', marginLeft: '16px' }}>
                            {formattedDate}
                          </div>
                        </div>

                        {log.details && (
                          <div style={{ fontSize: '14px', color: '#4b5563', marginTop: '8px', padding: '8px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                            {log.details}
                          </div>
                        )}

                        {log.previousValues && log.newValues && (
                          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px', fontStyle: 'italic' }}>
                            Status: {log.previousValues.status || 'N/A'} → {log.newValues.status || 'N/A'}
                          </div>
                        )}

                        {log.statusAtTime && (
                          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                            Status at time: {log.statusAtTime}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBookings;


