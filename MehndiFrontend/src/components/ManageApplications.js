import React, { useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { adminAPI } from '../services/api';
import Select from 'react-select';
import './admin-styles.css';

const ManageApplications = () => {
  const [stats, setStats] = useState([]);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [paginatedApplications, setPaginatedApplications] = useState([]);
  const [selectedItemsPerPage, setSelectedItemsPerPage] = useState({ value: 15, label: '15 per page' });

  // Status options
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'applied', label: 'Applied' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'expired', label: 'Expired' }
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

  // Filter applications based on search term, status, and city
  useEffect(() => {
    let filtered = applications;

    // Filter by search term (artist name, client name, budget, etc.)
    if (searchTerm) {
      filtered = filtered.filter(app => {
        const searchLower = searchTerm.toLowerCase();
        return (
          app.artist?.firstName?.toLowerCase().includes(searchLower) ||
          app.artist?.lastName?.toLowerCase().includes(searchLower) ||
          app.booking?.client?.firstName?.toLowerCase().includes(searchLower) ||
          app.booking?.client?.lastName?.toLowerCase().includes(searchLower) ||
          app.proposedBudget?.toString().includes(searchTerm) ||
          app.booking?.budgetMin?.toString().includes(searchTerm) ||
          app.booking?.budgetMax?.toString().includes(searchTerm) ||
          app.booking?.title?.toLowerCase().includes(searchLower) ||
          app.booking?.location?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Filter by status
    if (selectedStatus?.value) {
      filtered = filtered.filter(app => app.status === selectedStatus.value);
    }

    // Filter by city
    if (selectedCity?.value) {
      filtered = filtered.filter(app => 
        app.booking?.location?.toLowerCase().includes(selectedCity.value.toLowerCase())
      );
    }

    setFilteredApplications(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [applications, searchTerm, selectedStatus, selectedCity]);

  // Pagination logic
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedApplications(filteredApplications.slice(startIndex, endIndex));
  }, [filteredApplications, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);

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
    <div className="admin_dashboard-layout">
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
          <h2 className="admin_bookings-title">Manage Applications</h2>
          <p className="admin_bookings-subtitle">Review and manage artist applications</p>
        </div>

        {error && <p className="admin_error">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            

            {/* Application Stats Cards */}
            <div className="admin_booking-stats">
              <div className="admin_stat-card">
                <div className="admin_stat-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                </div>
                <div className="admin_stat-info">
                  <h3>Total Applications</h3>
                  <span className="admin_stat-number">{applications.length}</span>
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
                  <div key={s.status} className="admin_stat-card">
                    <div className="admin_stat-icon">
                      {icon}
                    </div>
                    <div className="admin_stat-info">
                      <h3>{s.status.charAt(0).toUpperCase() + s.status.slice(1)}</h3>
                      <span className="admin_stat-number">{s.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Filter Section */}
            <div className="admin_filter-section" style={{
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: '2rem',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: (searchTerm || selectedStatus?.value || selectedCity?.value) ? '1fr 1fr 1fr auto' : '1fr 1fr 1fr',
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
                    Search Applications
                  </label>
                  <input
                    type="text"
                    placeholder="Search by artist, client, budget..."
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

                {/* Cities Dropdown */}
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
                {(searchTerm || selectedStatus?.value || selectedCity?.value) && (
                  <div className="admin_filter-item" style={{ display: 'flex', alignItems: 'end' }}>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedStatus(null);
                        setSelectedCity(null);
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
              {paginatedApplications.length === 0 && filteredApplications.length === 0 ? (
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
                  <h3 style={{ color: '#6b7280', marginBottom: '0.5rem', fontSize: '1.125rem' }}>No applications found</h3>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                    {searchTerm || selectedStatus?.value || selectedCity?.value 
                      ? 'Try adjusting your filters to see more results.' 
                      : 'No applications have been submitted yet.'}
                  </p>
                </div>
              ) : (
                <table className="admin_styled-table">
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
                    {paginatedApplications.map(a => (
                      <tr key={a.applicationId}>
                        <td>{a.artist?.firstName} {a.artist?.lastName}</td>
                        <td>
                          <span className={`admin_status-badge ${
                            a.status === 'applied' ? 'pending' : 
                            a.status === 'accepted' ? 'confirmed' : 
                            a.status === 'completed' ? 'completed' : 
                            a.status === 'cancelled' ? 'cancelled' : 
                            a.status === 'expired' ? 'cancelled' : 'pending'
                          }`}>
                            {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                          </span>
                        </td>
                        <td>£{a.proposedBudget}</td>
                        <td>£{a.booking?.budgetMin} - £{a.booking?.budgetMax}</td>
                        <td>
                          <button className="admin_btn admin_btn-outline" onClick={() => setSelected(a)}>View Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Component */}
            {filteredApplications.length > 0 && (
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
                    of {filteredApplications.length} applications
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

            {selected && (
              <div className="admin_modal-overlay" onClick={() => setSelected(null)}>
                <div className="admin_payment-modal" onClick={(e)=>e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
                  <div className="admin_modal-header">
                    <h2 className="admin_modal-title">Application Details</h2>
                    <button className="admin_modal-close" onClick={() => setSelected(null)}>×</button>
                  </div>
                  <div className="admin_modal-body">
                    <div className="admin_details-grid">
                      <div className="admin_detail-card">
                        <h3 className="admin_modal-section-title">Artist</h3>
                        <div className="admin_detail-row">
                          <span className="admin_detail-label">Name</span>
                          <span className="admin_detail-value">{selected.artist?.firstName} {selected.artist?.lastName}</span>
                        </div>
                        <div className="admin_detail-row">
                          <span className="admin_detail-label">Email</span>
                          <span className="admin_detail-value">{selected.artist?.email}</span>
                        </div>
                      </div>

                      <div className="admin_detail-card">
                        <h3 className="admin_modal-section-title">Client/Booking</h3>
                        <div className="admin_detail-row">
                          <span className="admin_detail-label">Client</span>
                          <span className="admin_detail-value">{selected.booking?.client?.firstName} {selected.booking?.client?.lastName}</span>
                        </div>
                        <div className="admin_detail-row">
                          <span className="admin_detail-label">Email</span>
                          <span className="admin_detail-value">{selected.booking?.client?.email}</span>
                        </div>
                        <div className="admin_detail-row">
                          <span className="admin_detail-label">Event</span>
                          <span className="admin_detail-value">{selected.booking?.title || '—'}</span>
                        </div>
                        <div className="admin_detail-row">
                          <span className="admin_detail-label">Date</span>
                          <span className="admin_detail-value">{selected.booking?.eventDate ? new Date(selected.booking.eventDate).toLocaleDateString() : ''}</span>
                        </div>
                        <div className="admin_detail-row">
                          <span className="admin_detail-label">Location</span>
                          <span className="admin_detail-value">{selected.booking?.location}</span>
                        </div>
                      </div>

                      <div className="admin_detail-card">
                        <h3 className="admin_modal-section-title">Financials</h3>
                        <div className="admin_badges">
                          <span className="admin_badge">Proposed £{selected.proposedBudget}</span>
                          <span className="badge outline">Budget £{selected.booking?.budgetMin} – £{selected.booking?.budgetMax}</span>
                        </div>
                      </div>
                    </div>

                    {/* Images Section */}
                    {selected.booking?.images && selected.booking.images.length > 0 && (
                      <div className="admin_detail-card" style={{ marginTop: '1.5rem' }}>
                        <h3 className="admin_modal-section-title">Uploaded Images</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px', marginTop: '10px' }}>
                          {selected.booking.images.map((img, idx) => (
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
                    {selected.booking?.video && selected.booking.video !== "" && (
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
                            <source src={selected.booking.video} type="video/mp4" />
                            <source src={selected.booking.video} type="video/webm" />
                            <source src={selected.booking.video} type="video/ogg" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      </div>
                    )}

                    <div className="admin_status-row">
                      <span className="admin_detail-label">Status</span>
                      <span className={`admin_status-badge ${
                        selected.status === 'applied' ? 'pending' : 
                        selected.status === 'accepted' ? 'confirmed' : 
                        selected.status === 'completed' ? 'completed' : 
                        selected.status === 'cancelled' ? 'cancelled' : 
                        selected.status === 'expired' ? 'cancelled' : 'pending'
                      }`}>
                        {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                      </span>
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


