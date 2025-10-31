import React, { useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { adminAPI } from '../services/api';
import Select from 'react-select';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './admin-styles.css';

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
  const [selectedCity, setSelectedCity] = useState(null);

  // Confirmation modal states
  const [confirmAction, setConfirmAction] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [paginatedUsers, setPaginatedUsers] = useState([]);
  const [selectedItemsPerPage, setSelectedItemsPerPage] = useState({ value: 15, label: '15 per page' });
  const [hoverId, setHoverId] = useState(null);

  // Items per page options
  const itemsPerPageOptions = [
    { value: 5, label: '5 per page' },
    { value: 15, label: '15 per page' },
    { value: 30, label: '30 per page' }
  ];

  // City options
  const cityOptions = [
    { value: '', label: 'All Cities' },
    { value: 'London', label: 'London' },
    { value: 'Birmingham', label: 'Birmingham' },
    { value: 'Manchester', label: 'Manchester' },
    { value: 'Bradford', label: 'Bradford' }
  ];

  // Filter clients based on search term, status, request range, and city
  useEffect(() => {
    let filtered = users.filter(user => user.userType === 'client');

    // Filter by search term (name or email)
    if (searchTerm) {
      filtered = filtered.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        const fullId = String(user._id || '').toLowerCase();
        const displayId = formatDisplayId('CLT', user._id || '').toLowerCase();
        return (
          user.firstName?.toLowerCase().includes(searchLower) ||
          user.lastName?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          fullId.includes(searchLower) ||
          displayId.includes(searchLower)
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

    // Filter by city
    if (selectedCity?.value) {
      filtered = filtered.filter(user => 
        user.city?.toLowerCase().includes(selectedCity.value.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [users, searchTerm, selectedStatus, selectedRequestRange, selectedCity, userStats]);

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
      const dropdowns = document.querySelectorAll('.admin_dropdown-menu');
      dropdowns.forEach(menu => {
        if (!menu.closest('.admin_dropdown').contains(e.target)) {
          menu.style.display = 'none';
        }
      });
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleDelete = async (userId, userName) => {
    setConfirmAction({
      type: 'delete',
      userId,
      userName,
      message: `Delete this client? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await adminAPI.deleteUser(userId);
          toast.success(`${userName} deleted successfully!`);
          await load();
          setConfirmAction(null);
        } catch (error) {
          toast.error(`Failed to delete ${userName}. ${error.message}`);
          setConfirmAction(null);
        }
      }
    });
  };

  const handleRoleChange = async (userId, userType) => {
    await adminAPI.updateUser(userId, { userType });
    await load();
  };

  const handleStatusChange = async (userId, status, userName) => {
    setConfirmAction({
      type: status === 'suspended' ? 'suspend' : 'reinstate',
      userId,
      userName,
      message: status === 'suspended' 
        ? `Suspend this client? They will not be able to post new requests until reinstated.`
        : `Reinstate this client? They will be able to post new requests again.`,
      onConfirm: async () => {
        try {
          await adminAPI.updateUser(userId, { status });
          toast.success(`${userName} ${status === 'suspended' ? 'suspended' : 'reinstated'} successfully!`);
          await load();
          setConfirmAction(null);
        } catch (error) {
          toast.error(`Failed to ${status === 'suspended' ? 'suspend' : 'reinstate'} ${userName}. ${error.message}`);
          setConfirmAction(null);
        }
      }
    });
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
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
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
          <h2 className="admin_bookings-title">Manage Clients</h2>
          <p className="admin_bookings-subtitle">Manage all client users</p>
        </div>

        {/* Client Stats Cards */}
        <div className="admin_booking-stats">
          <div className="admin_stat-card">
            <div className="admin_stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="admin_stat-info">
              <h3>Total Clients</h3>
              <span className="admin_stat-number">{clients.length}</span>
            </div>
          </div>

          <div className="admin_stat-card">
            <div className="admin_stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4"/>
                <rect x="9" y="3" width="6" height="8"/>
                <circle cx="12" cy="12" r="2"/>
              </svg>
            </div>
            <div className="admin_stat-info">
              <h3>Total Requests</h3>
              <span className="admin_stat-number">{Object.values(userStats).reduce((sum, count) => sum + count, 0)}</span>
            </div>
          </div>
        </div>
        {error && <p className="admin_error">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {/* Filter Section */}
            <div className="admin_filter-section">
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
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

                {/* Status Filter */}
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
                    value={{ value: selectedStatus, label: selectedStatus === 'all' ? 'All Status' : selectedStatus === 'active' ? 'Active' : 'Suspended' }}
                    onChange={(option) => setSelectedStatus(option.value)}
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'active', label: 'Active' },
                      { value: 'suspended', label: 'Suspended' }
                    ]}
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
                        })
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

                {/* Request Range Filter */}
                <div className="admin_filter-item">
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#0f172a',
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
                        })
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

                {/* City Filter */}
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
                {(searchTerm || selectedStatus !== 'all' || selectedRequestRange !== 'all' || selectedCity?.value) && (
                  <div className="admin_filter-item" style={{ display: 'flex', alignItems: 'end' }}>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedStatus('all');
                        setSelectedRequestRange('all');
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
              {paginatedUsers.length === 0 && filteredUsers.length === 0 ? (
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
                  <h3 style={{ color: '#6b7280', marginBottom: '0.5rem', fontSize: '1.125rem' }}>No clients found</h3>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                    {(searchTerm || selectedStatus !== 'all' || selectedRequestRange !== 'all' || selectedCity?.value) 
                      ? 'Try adjusting your search or filters to see more results.' 
                      : 'No clients have been registered yet.'}
                  </p>
                </div>
              ) : (
                <table className="admin_styled-table">
                  <thead>
                    <tr>
                      <th>Id</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Location</th>
                      <th>Total Requests</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map(u => (
                      <tr key={u._id}>
                        <td onMouseEnter={() => setHoverId(u._id)} onMouseLeave={() => setHoverId(null)}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
                            <span style={{ fontWeight: 600 }}>{formatDisplayId('CLT', u._id)}</span>
                            {hoverId === u._id && (
                              <button
                                title="Copy Full ID"
                                onClick={(e) => { copyFullId(e, u._id); toast.success('ID copied successfully'); }}
                                style={{ position: 'absolute', bottom: '100%', left: 0, background: '#0b1220', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.70rem', padding: '6px 10px', borderRadius: 6, zIndex: 9999, boxShadow: '0 6px 16px rgba(0,0,0,0.18)' }}
                              >
                                Copy Full ID
                              </button>
                            )}
                          </div>
                        </td>
                        <td>{u.firstName} {u.lastName}</td>
                        <td>{u.email}</td>
                        <td>{u.city || 'None'}</td>
                        <td>
                          <span className="admin_badge">
                            {userStats[u._id] || 0}
                          </span>
                        </td>
                        <td>
                          <span className={`admin_status-badge ${u.status === 'suspended' ? 'cancelled' : 'completed'}`}>
                            {u.status === 'suspended' ? 'Suspended' : 'Active'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button className="admin_btn admin_btn-outline" onClick={() => openEdit(u)}>Edit</button>
                            <div className="admin_dropdown" style={{ position: 'relative' }}>
                              <button 
                                className="admin_btn admin_btn-outline" 
                                style={{ padding: '0.25rem 0.5rem', fontSize: '1.2rem', lineHeight: '1' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const dropdown = e.target.closest('.admin_dropdown');
                                  const menu = dropdown.querySelector('.admin_dropdown-menu');
                                  menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
                                }}
                              >
                                ⋮
                              </button>
                              <div className="admin_dropdown-menu" style={{
                                display: 'none',
                                position: 'absolute',
                                right: 0,
                                bottom: '100%',
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                boxShadow: '0 -4px 6px rgba(0,0,0,0.1)',
                                zIndex: 9999,
                                minWidth: '120px',
                                marginBottom: '0.25rem'
                              }}>
                                {u.status !== 'suspended' ? (
                                  <button
                                    onClick={() => {
                                      handleStatusChange(u._id, 'suspended', `${u.firstName} ${u.lastName}`);
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '0.5rem 1rem',
                                      border: 'none',
                                      background: 'none',
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                      fontSize: '0.875rem',
                                      color: '#0f172a'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                  >
                                    Suspend
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      handleStatusChange(u._id, 'active', `${u.firstName} ${u.lastName}`);
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '0.5rem 1rem',
                                      border: 'none',
                                      background: 'none',
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                      fontSize: '0.875rem',
                                      color: '#0f172a'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                  >
                                    Reinstate
                                  </button>
                                )}
                                {(() => { try { return String(u._id) !== String((JSON.parse(localStorage.getItem('user')||'{}'))._id); } catch { return true; } })() && (
                                  <button
                                    onClick={() => handleDelete(u._id, `${u.firstName} ${u.lastName}`)}
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

        {editing && (
          <div className="admin_modal-overlay" onClick={closeEdit}>
            <div className="admin_payment-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin_modal-header">
                <h2 className="admin_modal-title">Edit Client</h2>
                <button className="admin_modal-close" onClick={closeEdit}>×</button>
              </div>
              <form onSubmit={submitEdit} className="admin_form-grid" style={{ padding: '1rem' }}>
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
                  <button type="button" className="admin_btn admin_btn-light" onClick={closeEdit}>Cancel</button>
                  <button type="submit" className="admin_btn admin_btn-primary">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmAction && (
          <div className="admin_modal-overlay" onClick={() => setConfirmAction(null)}>
            <div className="admin_confirm-modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="admin_confirm-title">
                {confirmAction.type === 'delete' && 'Delete Client?'}
                {confirmAction.type === 'suspend' && 'Suspend Client?'}
                {confirmAction.type === 'reinstate' && 'Reinstate Client?'}
              </h3>
              <p className="admin_confirm-message">{confirmAction.message}</p>
              <div className="admin_confirm-actions">
                <button 
                  className="admin_btn admin_btn-light" 
                  onClick={() => setConfirmAction(null)}
                >
                  Cancel
                </button>
                <button 
                  className={`admin_btn ${confirmAction.type === 'delete' ? 'admin_btn-danger' : 'admin_btn-primary'}`}
                  onClick={confirmAction.onConfirm}
                >
                  {confirmAction.type === 'delete' && 'Delete'}
                  {confirmAction.type === 'suspend' && 'Suspend'}
                  {confirmAction.type === 'reinstate' && 'Reinstate'}
                </button>
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

export default ManageClients;
