import React, { useCallback, useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';
import apiService from '../services/api';
import Select from 'react-select';
import './admin-styles.css';

const formatGBP = (n) => `£${Number(n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const AdminWallet = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { transactionAPI } = apiService;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [paginatedTransactions, setPaginatedTransactions] = useState([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [selectedItemsPerPage, setSelectedItemsPerPage] = useState({ value: 15, label: '15 per page' });
  const itemsPerPageOptions = [
    { value: 5, label: '5 per page' },
    { value: 15, label: '15 per page' },
    { value: 30, label: '30 per page' }
  ];

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const txRes = await transactionAPI.getAllTransactions();
      const txs = Array.isArray(txRes?.data) ? txRes.data : [];
      const mapped = txs.map((t) => ({
        id: t._id || t.id,
        event: t.event || t.description || 'Transaction',
        method: t.method || t.provider || 'Stripe',
        type: t.transactionType || t.type || t.category || 'payment',
        status: t.status || 'Paid',
        date: t.createdAt ? new Date(t.createdAt) : new Date(),
        amount: Number(t.amount || 0)
      }));
      setWalletTransactions(mapped);
    } catch (e) {
      setError(e?.message || 'Failed to load transactions');
      setWalletTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [transactionAPI]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Update paginated slice when list or page changes
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedTransactions(walletTransactions.slice(startIndex, endIndex));
  }, [walletTransactions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(walletTransactions.length / itemsPerPage) || 1;
  const handlePreviousPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const handlePageChange = (page) => setCurrentPage(page);
  const handleItemsPerPageChange = (option) => { setItemsPerPage(option.value); setSelectedItemsPerPage(option); setCurrentPage(1); };
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      for (let i = startPage; i <= endPage; i++) pages.push(i);
    }
    return pages;
  };

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
          <main className="admin_dashboard-content">
            <div className="admin_bookings-header">
              <h2 className="admin_bookings-title">Transactions</h2>
              <p className="admin_bookings-subtitle">Review and manage platform transactions</p>
            </div>

            {/* Transactions */}
            <div className="admin_transactions-card" style={{ background: '#ffffff', border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', background: '#ffffff' }}>
                <h3 className="admin_section-title" style={{ margin: 0 }}>Transaction History</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                {loading ? (
                  <div style={{ padding: '20px', textAlign: 'center' }}>Loading transactions…</div>
                ) : error ? (
                  <div style={{ padding: '20px', color: '#b91c1c' }}>{error}</div>
                ) : walletTransactions.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center' }}>No transactions found.</div>
                ) : (
                  <table className="admin_styled-table">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Event</th>
                        <th style={{ textAlign: 'left' }}>Method</th>
                        <th style={{ textAlign: 'left' }}>Type</th>
                        <th style={{ textAlign: 'left' }}>Status</th>
                        <th style={{ textAlign: 'left' }}>Date</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTransactions.map((tx) => (
                        <tr key={tx.id}>
                          <td style={{ color: '#0f172a' }}>{tx.event}</td>
                          <td style={{ color: '#0f172a' }}>{tx.method}</td>
                          <td style={{ color: '#0f172a', textTransform: 'capitalize' }}>{tx.type}</td>
                          <td>
                            <span className="admin_status-badge completed" style={{ textTransform: 'capitalize' }}>{tx.status}</span>
                          </td>
                          <td style={{ color: '#0f172a' }}>{new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{formatGBP(tx.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Pagination Component */}
            {walletTransactions.length > 0 && (
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
                    of {walletTransactions.length} transactions
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
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminWallet;


