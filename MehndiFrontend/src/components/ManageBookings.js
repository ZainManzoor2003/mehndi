import React, { useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';
import api from '../services/api';
import Select from 'react-select';

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
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

  // Status options
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
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
    { value: 'Glasgow', label: 'Glasgow' },
    { value: 'Liverpool', label: 'Liverpool' },
    { value: 'Leeds', label: 'Leeds' },
    { value: 'Edinburgh', label: 'Edinburgh' },
    { value: 'Bristol', label: 'Bristol' },
    { value: 'Cardiff', label: 'Cardiff' },
    { value: 'Sheffield', label: 'Sheffield' },
    { value: 'Bradford', label: 'Bradford' },
    { value: 'Leicester', label: 'Leicester' },
    { value: 'Coventry', label: 'Coventry' },
    { value: 'Belfast', label: 'Belfast' },
    { value: 'Nottingham', label: 'Nottingham' },
    { value: 'Newcastle', label: 'Newcastle upon Tyne' },
    { value: 'Brighton', label: 'Brighton' },
    { value: 'Hull', label: 'Hull' },
    { value: 'Plymouth', label: 'Plymouth' },
    { value: 'Stoke', label: 'Stoke-on-Trent' },
    { value: 'Wolverhampton', label: 'Wolverhampton' },
    { value: 'Derby', label: 'Derby' },
    { value: 'Swansea', label: 'Swansea' },
    { value: 'Southampton', label: 'Southampton' },
    { value: 'Salford', label: 'Salford' },
    { value: 'Aberdeen', label: 'Aberdeen' },
    { value: 'Westminster', label: 'Westminster' },
    { value: 'Portsmouth', label: 'Portsmouth' },
    { value: 'York', label: 'York' }
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
        return (
          booking.firstName?.toLowerCase().includes(searchLower) ||
          booking.lastName?.toLowerCase().includes(searchLower) ||
          booking.email?.toLowerCase().includes(searchLower) ||
          booking.otherEventType?.toLowerCase().includes(searchLower) ||
          booking.eventType?.join(', ').toLowerCase().includes(searchLower) ||
          booking.minimumBudget?.toString().includes(searchTerm) ||
          booking.maximumBudget?.toString().includes(searchTerm) ||
          booking.city?.toLowerCase().includes(searchLower) ||
          booking.fullAddress?.toLowerCase().includes(searchLower)
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
        booking.city?.toLowerCase().includes(selectedCity.value.toLowerCase()) ||
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
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {/* Booking Stats Cards */}
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
          {/* Filter Section */}
          <div className="filter-section" style={{
              backgroundColor: '#fff',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: '2rem',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: (searchTerm || selectedStatus?.value || selectedEventType?.value || selectedCity?.value) ? '1fr 1fr 1fr 1fr auto' : '1fr 1fr 1fr 1fr',
                gap: '1rem',
                alignItems: 'end'
              }}>
                {/* Search Input */}
                <div className="filter-item">
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
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
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      transition: 'border-color 0.2s',
                      backgroundColor: '#f9fafb'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#d4a574';
                      e.target.style.backgroundColor = '#fff';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#f9fafb';
                    }}
                  />
                </div>

                {/* Status Dropdown */}
                <div className="filter-item">
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
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
                        border: '2px solid #d1d5db',
                        borderRadius: '8px',
                        minHeight: '42px',
                        backgroundColor: '#f9fafb',
                        boxShadow: 'none',
                        '&:hover': {
                          borderColor: '#d4a574'
                        },
                        ...(state.isFocused && {
                          borderColor: '#d4a574',
                          backgroundColor: '#fff'
                        })
                      }),
                      placeholder: (provided) => ({
                        ...provided,
                        color: '#6b7280',
                        fontSize: '0.875rem'
                      }),
                      option: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isSelected ? '#d4a574' : state.isFocused ? '#fef7ed' : '#fff',
                        color: state.isSelected ? '#fff' : '#374151',
                        fontSize: '0.875rem'
                      }),
                      singleValue: (provided) => ({
                        ...provided,
                        color: '#374151',
                        fontSize: '0.875rem'
                      })
                    }}
                  />
                </div>

                {/* Event Type Dropdown */}
                <div className="filter-item">
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
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
                        border: '2px solid #d1d5db',
                        borderRadius: '8px',
                        minHeight: '42px',
                        backgroundColor: '#f9fafb',
                        boxShadow: 'none',
                        '&:hover': {
                          borderColor: '#d4a574'
                        },
                        ...(state.isFocused && {
                          borderColor: '#d4a574',
                          backgroundColor: '#fff'
                        })
                      }),
                      placeholder: (provided) => ({
                        ...provided,
                        color: '#6b7280',
                        fontSize: '0.875rem'
                      }),
                      option: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isSelected ? '#d4a574' : state.isFocused ? '#fef7ed' : '#fff',
                        color: state.isSelected ? '#fff' : '#374151',
                        fontSize: '0.875rem'
                      }),
                      singleValue: (provided) => ({
                        ...provided,
                        color: '#374151',
                        fontSize: '0.875rem'
                      })
                    }}
                  />
                </div>

                {/* City Dropdown */}
                <div className="filter-item">
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
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
                        border: '2px solid #d1d5db',
                        borderRadius: '8px',
                        minHeight: '42px',
                        backgroundColor: '#f9fafb',
                        boxShadow: 'none',
                        '&:hover': {
                          borderColor: '#d4a574'
                        },
                        ...(state.isFocused && {
                          borderColor: '#d4a574',
                          backgroundColor: '#fff'
                        })
                      }),
                      placeholder: (provided) => ({
                        ...provided,
                        color: '#6b7280',
                        fontSize: '0.875rem'
                      }),
                      option: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isSelected ? '#d4a574' : state.isFocused ? '#fef7ed' : '#fff',
                        color: state.isSelected ? '#fff' : '#374151',
                        fontSize: '0.875rem'
                      }),
                      singleValue: (provided) => ({
                        ...provided,
                        color: '#374151',
                        fontSize: '0.875rem'
                      })
                    }}
                  />
                </div>

                {/* Clear Filters Button */}
                {(searchTerm || selectedStatus?.value || selectedEventType?.value || selectedCity?.value || selectedUserType?.value) && (
                  <div className="filter-item" style={{ display: 'flex', alignItems: 'end' }}>
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
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        color: '#6b7280',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = '#d4a574';
                        e.target.style.color = '#d4a574';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.color = '#6b7280';
                      }}
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="table-responsive" style={{ marginTop: '1rem' }}>
              {paginatedBookings.length === 0 && filteredBookings.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  backgroundColor: '#f9fafb',
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
                    {paginatedBookings.map(b => (
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
              )}
            </div>

            {/* Pagination Component */}
            {filteredBookings.length > 0 && (
              <div className="pagination-container" style={{
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
                      control: (provided) => ({
                        ...provided,
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        minHeight: '36px',
                        width: '120px',
                        backgroundColor: '#f9fafb',
                        boxShadow: 'none',
                        '&:hover': {
                          borderColor: '#d4a574'
                        }
                      }),
                      placeholder: (provided) => ({
                        ...provided,
                        color: '#6b7280',
                        fontSize: '0.75rem'
                      }),
                      option: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isSelected ? '#d4a574' : state.isFocused ? '#fef7ed' : '#fff',
                        color: state.isSelected ? '#fff' : '#374151',
                        fontSize: '0.75rem'
                      }),
                      singleValue: (provided) => ({
                        ...provided,
                        color: '#374151',
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
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: currentPage === 1 ? '#f9fafb' : '#fff',
                      color: currentPage === 1 ? '#9ca3af' : '#374151',
                      fontSize: '0.875rem',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== 1) {
                        e.target.style.borderColor = '#d4a574';
                        e.target.style.color = '#d4a574';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== 1) {
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.color = '#374151';
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
                          border: `1px solid ${currentPage === pageNum ? '#d4a574' : '#d1d5db'}`,
                          borderRadius: '6px',
                          backgroundColor: currentPage === pageNum ? '#d4a574' : '#fff',
                          color: currentPage === pageNum ? '#fff' : '#374151',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          minWidth: '40px'
                        }}
                        onMouseEnter={(e) => {
                          if (currentPage !== pageNum) {
                            e.target.style.borderColor = '#d4a574';
                            e.target.style.backgroundColor = '#fef7ed';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (currentPage !== pageNum) {
                            e.target.style.borderColor = '#d1d5db';
                            e.target.style.backgroundColor = '#fff';
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
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: currentPage === totalPages ? '#f9fafb' : '#fff',
                      color: currentPage === totalPages ? '#9ca3af' : '#374151',
                      fontSize: '0.875rem',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== totalPages) {
                        e.target.style.borderColor = '#d4a574';
                        e.target.style.color = '#d4a574';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== totalPages) {
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.color = '#374151';
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
          <div className="modal-overlay" onClick={() => setSelected(null)}>
            <div className="payment-modal" onClick={(e)=>e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
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

                {/* Images Section */}
                {selected.images && selected.images.length > 0 && (
                  <div className="detail-card" style={{ marginTop: '1.5rem' }}>
                    <h3 className="modal-section-title">Uploaded Images</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px', marginTop: '10px' }}>
                      {selected.images.map((img, idx) => (
                        <div key={idx} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '2px solid #d4a574' }}>
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
                  <div className="detail-card" style={{ marginTop: '1.5rem' }}>
                    <h3 className="modal-section-title">Uploaded Video</h3>
                    <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #d4a574' }}>
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


