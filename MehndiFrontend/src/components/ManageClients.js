import React, { useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { adminAPI } from '../services/api';
import Select from 'react-select';

const ManageClients = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', userType: 'client', password: '' });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [userStats, setUserStats] = useState({});
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRequestRange, setSelectedRequestRange] = useState('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [paginatedUsers, setPaginatedUsers] = useState([]);
  const [selectedItemsPerPage, setSelectedItemsPerPage] = useState({ value: 15, label: '15 per page' });

  // Items per page options
  const itemsPerPageOptions = [
    { value: 5, label: '5 per page' },
    { value: 15, label: '15 per page' },
    { value: 30, label: '30 per page' }
  ];

  // Filter clients based on search term, status, and request range
  useEffect(() => {
    let filtered = users.filter(user => user.userType === 'client');

    // Filter by search term (name or email)
    if (searchTerm) {
      filtered = filtered.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        return (
          user.firstName?.toLowerCase().includes(searchLower) ||
          user.lastName?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(user => user.status === selectedStatus);
    }

    // Filter by request range
    if (selectedRequestRange !== 'all') {
      filtered = filtered.filter(user => {
        const requestCount = userStats[user._id] || 0;
        switch (selectedRequestRange) {
          case '1-5':
            return requestCount >= 1 && requestCount <= 5;
          case '6-20':
            return requestCount >= 6 && requestCount <= 20;
          case '20+':
            return requestCount > 20;
          default:
            return true;
        }
      });
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [users, searchTerm, selectedStatus, selectedRequestRange, userStats]);

  // Pagination logic
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedUsers(filteredUsers.slice(startIndex, endIndex));
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

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

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.listUsers();
      setUsers(res.data || []);
      
      // Load user stats for bookings count
      const clientIds = (res.data || []).filter(u => u.userType === 'client').map(u => u._id);
      const stats = {};
      
      for (const clientId of clientIds) {
        try {
          const bookingsRes = await adminAPI.getUserBookings(clientId);
          stats[clientId] = bookingsRes.data?.length || 0;
        } catch (e) {
          stats[clientId] = 0;
        }
      }
      
      setUserStats(stats);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const dropdowns = document.querySelectorAll('.dropdown-menu');
      dropdowns.forEach(menu => {
        if (!menu.closest('.dropdown').contains(e.target)) {
          menu.style.display = 'none';
        }
      });
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this client?')) return;
    await adminAPI.deleteUser(userId);
    await load();
  };

  const handleRoleChange = async (userId, userType) => {
    await adminAPI.updateUser(userId, { userType });
    await load();
  };

  const handleStatusChange = async (userId, status) => {
    await adminAPI.updateUser(userId, { status });
    await load();
  };

  const openEdit = (u) => {
    setEditing(u._id);
    setForm({ firstName: u.firstName || '', lastName: u.lastName || '', email: u.email || '', userType: u.userType || 'client', password: '' });
  };

  const closeEdit = () => { setEditing(null); setForm({ firstName: '', lastName: '', email: '', userType: 'client', password: '' }); };

  const submitEdit = async (e) => {
    e.preventDefault();
    const payload = { firstName: form.firstName, lastName: form.lastName, email: form.email, userType: form.userType };
    if (form.password && form.password.length >= 6) payload.password = form.password;
    await adminAPI.updateUser(editing, payload);
    closeEdit();
    await load();
  };

  const clients = users.filter(u => u.userType === 'client');

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
          <h2 className="bookings-title">Manage Clients</h2>
          <p className="bookings-subtitle">Manage all client users</p>
        </div>

        {/* Client Stats Cards */}
        <div className="booking-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>Total Clients</h3>
              <span className="stat-number">{clients.length}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4"/>
                <rect x="9" y="3" width="6" height="8"/>
                <circle cx="12" cy="12" r="2"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>Total Requests</h3>
              <span className="stat-number">{Object.values(userStats).reduce((sum, count) => sum + count, 0)}</span>
            </div>
          </div>
        </div>
        {error && <p className="error">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
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
                gridTemplateColumns: '1fr 1fr 1fr auto',
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
                    Search Clients
                  </label>
                  <input
                    type="text"
                    placeholder="Search by name or email..."
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

                {/* Status Filter */}
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
                    value={{ value: selectedStatus, label: selectedStatus === 'all' ? 'All Status' : selectedStatus === 'active' ? 'Active' : 'Suspended' }}
                    onChange={(option) => setSelectedStatus(option.value)}
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'active', label: 'Active' },
                      { value: 'suspended', label: 'Suspended' }
                    ]}
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        border: '2px solid #d1d5db',
                        borderRadius: '8px',
                        minHeight: '42px',
                        backgroundColor: '#f9fafb',
                        boxShadow: 'none',
                        '&:hover': {
                          borderColor: '#d4a574'
                        }
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

                {/* Request Range Filter */}
                <div className="filter-item">
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.875rem'
                  }}>
                    All Requests
                  </label>
                  <Select
                    value={{ value: selectedRequestRange, label: selectedRequestRange === 'all' ? 'All Requests' : selectedRequestRange + ' Requests' }}
                    onChange={(option) => setSelectedRequestRange(option.value)}
                    options={[
                      { value: 'all', label: 'All Requests' },
                      { value: '1-5', label: '1-5 Requests' },
                      { value: '6-20', label: '6-20 Requests' },
                      { value: '20+', label: '20+ Requests' }
                    ]}
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        border: '2px solid #d1d5db',
                        borderRadius: '8px',
                        minHeight: '42px',
                        backgroundColor: '#f9fafb',
                        boxShadow: 'none',
                        '&:hover': {
                          borderColor: '#d4a574'
                        }
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
                {(searchTerm || selectedStatus !== 'all' || selectedRequestRange !== 'all') && (
                  <div className="filter-item" style={{ display: 'flex', alignItems: 'end' }}>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedStatus('all');
                        setSelectedRequestRange('all');
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
              {paginatedUsers.length === 0 && filteredUsers.length === 0 ? (
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
                  <h3 style={{ color: '#6b7280', marginBottom: '0.5rem', fontSize: '1.125rem' }}>No clients found</h3>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                    {searchTerm 
                      ? 'Try adjusting your search to see more results.' 
                      : 'No clients have been registered yet.'}
                  </p>
                </div>
              ) : (
                <table className="styled-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Total Requests</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map(u => (
                      <tr key={u._id}>
                        <td>{u.firstName} {u.lastName}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className="badge" style={{
                            backgroundColor: '#d4a574',
                            color: '#fff',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem'
                          }}>
                            {userStats[u._id] || 0}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: (u.status === 'suspended') ? '#fee2e2' : '#d1fae5',
                            color: (u.status === 'suspended') ? '#991b1b' : '#065f46'
                          }}>
                            {u.status === 'suspended' ? 'Suspended' : 'Active'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button className="btn btn-outline" onClick={() => openEdit(u)}>Edit</button>
                            <div className="dropdown" style={{ position: 'relative' }}>
                              <button 
                                className="btn btn-outline" 
                                style={{ padding: '0.25rem 0.5rem', fontSize: '1.2rem', lineHeight: '1' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const dropdown = e.target.closest('.dropdown');
                                  const menu = dropdown.querySelector('.dropdown-menu');
                                  menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
                                }}
                              >
                                ⋮
                              </button>
                              <div className="dropdown-menu" style={{
                                display: 'none',
                                position: 'absolute',
                                right: 0,
                                bottom: '100%',
                                backgroundColor: '#fff',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                boxShadow: '0 -4px 6px rgba(0,0,0,0.1)',
                                zIndex: 9999,
                                minWidth: '120px',
                                marginBottom: '0.25rem'
                              }}>
                                {u.status !== 'suspended' ? (
                                  <button
                                    onClick={() => {
                                      if (window.confirm('Suspend this client?')) {
                                        handleStatusChange(u._id, 'suspended');
                                      }
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '0.5rem 1rem',
                                      border: 'none',
                                      background: 'none',
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                      fontSize: '0.875rem',
                                      color: '#374151'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                  >
                                    Suspend
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      if (window.confirm('Reinstate this client?')) {
                                        handleStatusChange(u._id, 'active');
                                      }
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '0.5rem 1rem',
                                      border: 'none',
                                      background: 'none',
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                      fontSize: '0.875rem',
                                      color: '#374151'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                  >
                                    Reinstate
                                  </button>
                                )}
                                {(() => { try { return String(u._id) !== String((JSON.parse(localStorage.getItem('user')||'{}'))._id); } catch { return true; } })() && (
                                  <button
                                    onClick={() => handleDelete(u._id)}
                                    style={{
                                      width: '100%',
                                      padding: '0.5rem 1rem',
                                      border: 'none',
                                      background: 'none',
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                      fontSize: '0.875rem',
                                      color: '#dc2626'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#fee2e2'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Component */}
            {filteredUsers.length > 0 && (
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
                    of {filteredUsers.length} clients
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

        {editing && (
          <div className="modal-overlay" onClick={closeEdit}>
            <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Edit Client</h2>
                <button className="modal-close" onClick={closeEdit}>×</button>
              </div>
              <form onSubmit={submitEdit} className="form-grid" style={{ padding: '1rem' }}>
                <label>First name
                  <input type="text" placeholder="First name" value={form.firstName} onChange={(e)=>setForm({...form, firstName:e.target.value})} required />
                </label>
                <label>Last name
                  <input type="text" placeholder="Last name" value={form.lastName} onChange={(e)=>setForm({...form, lastName:e.target.value})} required />
                </label>
                <label>Email
                  <input type="email" placeholder="Email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} required />
                </label>
                <label>New password (optional, min 6)
                  <input type="password" placeholder="New password (optional, min 6)" value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})} />
                </label>
                <div style={{ display:'flex', gap:'8px', marginTop:'8px' }}>
                  <button type="button" className="btn btn-light" onClick={closeEdit}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default ManageClients;
