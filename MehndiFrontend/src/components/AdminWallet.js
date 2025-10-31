import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
  const [statusFilter, setStatusFilter] = useState('all');
  // Month picker state
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-11
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  const filteredTransactions = useMemo(() => {
    const matchesStatus = (row) => {
      if (statusFilter === 'all') return true;
      return (statusFilter === 'paid' && row.status === 'Paid') || (statusFilter === 'pending' && row.status === 'Pending');
    };
    const matchesMonth = (row) => {
      if (selectedMonth === null || selectedMonth === undefined) return true;
      const d = new Date(row.date);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    };
    return (walletTransactions || []).filter((r) => matchesStatus(r) && matchesMonth(r));
  }, [walletTransactions, statusFilter, selectedYear, selectedMonth]);

  const kpi = useMemo(() => {
    const totalGross = filteredTransactions.reduce((s, r) => s + (Number(r.gross) || 0), 0);
    const totalPayout = filteredTransactions.reduce((s, r) => s + (Number(r.payout) || 0), 0);
    return { totalGross, commission: 0, totalPayout };
  }, [filteredTransactions]);

  const handleExportCSV = useCallback(() => {
    try {
      const headers = ['Client','Artist','Gross (£)','Commission (15%)','Payout (£)','Status','Date','Method'];
      const rows = filteredTransactions.map(r => [
        r.clientName || '',
        r.artistName || '',
        (Number(r.gross) || 0).toFixed(2),
        (0).toFixed(2),
        (Number(r.payout) || 0).toFixed(2),
        r.status || '',
        new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        r.method || ''
      ]);
      const csv = [headers, ...rows]
        .map(row => row.map(field => {
          const str = String(field);
          // Escape quotes and wrap fields containing separators/newlines
          const escaped = str.replace(/"/g, '""');
          return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
        }).join(','))
        .join('\n');

      const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const monthLabel = selectedMonth !== null && selectedMonth !== undefined ? `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][selectedMonth]}_${selectedYear}` : 'all';
      a.href = url;
      a.download = `platform-transactions_${monthLabel}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
  }, [filteredTransactions, selectedMonth, selectedYear]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [selectedItemsPerPage, setSelectedItemsPerPage] = useState({ value: 15, label: '15 per page' });
  const [hoverId, setHoverId] = useState(null);
  const itemsPerPageOptions = [
    { value: 5, label: '5 per page' },
    { value: 15, label: '15 per page' },
    { value: 30, label: '30 per page' }
  ];

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const txRes = await transactionAPI.getPlatformTransactions();
      const txs = Array.isArray(txRes?.data) ? txRes.data : [];
      setWalletTransactions(txs);
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
          <main className="admin_dashboard-content">
            <div className="admin_bookings-header">
              <h2 className="admin_bookings-title">Transactions</h2>
              <p className="admin_bookings-subtitle">Review and manage platform transactions</p>
            </div>

          {/* KPI Cards */}
          <div style={{ display: 'flex', gap: '20px', marginTop: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 260px', background: '#ffffff', border: '1px solid #eef0f3', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 0 rgba(16, 24, 40, 0.02)' }}>
              <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '6px' }}>Total Bookings</div>
              <div style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.35rem' }}>{formatGBP(kpi.totalGross)}</div>
            </div>
            <div style={{ flex: '1 1 260px', background: '#ffffff', border: '1px solid #eef0f3', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 0 rgba(16, 24, 40, 0.02)' }}>
              <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '6px' }}>Platform Commission (15%)</div>
              <div style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.35rem' }}>{formatGBP(kpi.commission)}</div>
            </div>
            <div style={{ flex: '1 1 260px', background: '#ffffff', border: '1px solid #eef0f3', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 0 rgba(16, 24, 40, 0.02)' }}>
              <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '6px' }}>Artist Payouts</div>
              <div style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.35rem' }}>{formatGBP(kpi.totalPayout)}</div>
            </div>
          </div>

          {/* Filters Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {/* Left: Type filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-flex', width: 32, height: 32, border: '1px solid #cbd5e1', borderRadius: 6, alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 5h18l-7 8v6l-4-2v-4L3 5z"/>
                </svg>
              </span>
              <select
                value={statusFilter}
                style={{ height: 36, border: '1px solid #e5e7eb', borderRadius: 6, padding: '0 10px', background: '#ffffff', color: '#0f172a' }}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Middle: Date range */
            }
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 260px', justifyContent: 'flex-end' }}>
              <span style={{ display: 'inline-flex', width: 32, height: 32, border: '1px solid #cbd5e1', borderRadius: 6, alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="5" width="18" height="16" rx="2"/>
                  <line x1="16" y1="3" x2="16" y2="7"/>
                  <line x1="8" y1="3" x2="8" y2="7"/>
                  <line x1="3" y1="11" x2="21" y2="11"/>
                </svg>
              </span>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                  style={{
                    height: 36,
                    minWidth: 180,
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    padding: '0 12px',
                    background: '#ffffff',
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ color: selectedYear && selectedMonth !== null ? '#0f172a' : '#94a3b8' }}>
                    {selectedYear && selectedMonth !== null
                      ? `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][selectedMonth]} ${selectedYear}`
                      : 'yyyy-mm-dd'}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {isMonthPickerOpen && (
                  <div style={{ position: 'absolute', top: 44, right: 0, zIndex: 20, background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 10px 20px rgba(2,6,23,0.08)', padding: 12, width: 260 }}>
                    <input
                      type="number"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      style={{ width: '100%', height: 32, border: '1px solid #e5e7eb', borderRadius: 6, padding: '0 8px', marginBottom: 10 }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                      {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, idx) => (
                        <button
                          key={m}
                          onClick={() => { setSelectedMonth(idx); setIsMonthPickerOpen(false); }}
                          style={{
                            height: 34,
                            borderRadius: 8,
                            border: idx === selectedMonth ? '2px solid #334155' : '1px solid #e5e7eb',
                            background: idx === selectedMonth ? '#334155' : '#ffffff',
                            color: idx === selectedMonth ? '#ffffff' : '#0f172a',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                      <button type="button" onClick={() => { setSelectedMonth(null); }} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer' }}>Clear</button>
                      <button type="button" onClick={() => { const d = new Date(); setSelectedYear(d.getFullYear()); setSelectedMonth(d.getMonth()); setIsMonthPickerOpen(false); }} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer' }}>This month</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Export */}
            <button
              type="button"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0b1220', color: '#ffffff', border: '1px solid #0b1220', height: 40, padding: '0 14px', borderRadius: 10, cursor: 'pointer' }}
              onClick={handleExportCSV}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="3" width="16" height="18" rx="2"/>
                <line x1="8" y1="7" x2="16" y2="7"/>
                <line x1="8" y1="11" x2="16" y2="11"/>
                <line x1="8" y1="15" x2="12" y2="15"/>
              </svg>
              Export CSV
            </button>
          </div>

            {/* Transactions (Hard-coded to match design) */}
            <div className="admin_transactions-card" style={{ background: '#ffffff', border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', background: '#ffffff' }}>
                <h3 className="admin_section-title" style={{ margin: 0 }}>Transaction History</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                {loading ? (
                  <div style={{ padding: '20px', textAlign: 'center' }}>Loading transactions…</div>
                ) : error ? (
                  <div style={{ padding: '20px', color: '#b91c1c' }}>{error}</div>
                ) : filteredTransactions.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center' }}>No transactions found.</div>
                ) : (
                  <table className="admin_styled-table">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Id</th>
                        <th style={{ textAlign: 'left' }}>Client</th>
                        <th style={{ textAlign: 'left' }}>Artist</th>
                        <th style={{ textAlign: 'left' }}>Gross (£)</th>
                        <th style={{ textAlign: 'left' }}>Commission (15%)</th>
                        <th style={{ textAlign: 'left' }}>Payout (£)</th>
                        <th style={{ textAlign: 'left' }}>Status</th>
                        <th style={{ textAlign: 'left' }}>Date</th>
                        <th style={{ textAlign: 'left' }}>Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((row) => (
                        <tr key={row.id}>
                          <td style={{ color: '#0f172a' }} onMouseEnter={() => setHoverId(row.id)} onMouseLeave={() => setHoverId(null)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
                              <span style={{ fontWeight: 600 }}>{formatDisplayId('PAY', row.id)}</span>
                              {hoverId === row.id && (
                                <button
                                  title="Copy Full ID"
                                  onClick={(e) => { copyFullId(e, row.id); toast.success('ID copied successfully'); }}
                                  style={{ position: 'absolute', bottom: '100%', left: 0, background: '#0b1220', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.70rem', padding: '6px 10px', borderRadius: 6, zIndex: 9999, boxShadow: '0 6px 16px rgba(0,0,0,0.18)' }}
                                >
                                  Copy Full ID
                                </button>
                              )}
                            </div>
                          </td>
                          <td style={{ color: '#0f172a' }}>{row.clientName}</td>
                          <td style={{ color: '#0f172a' }}>{row.artistName}</td>
                          <td style={{ color: '#0f172a', fontWeight: 700 }}>{row.gross != null ? formatGBP(row.gross) : '—'}</td>
                          <td style={{ color: '#0f172a' }}>{formatGBP(0)}</td>
                          <td style={{ color: '#0f172a' }}>{formatGBP(row.payout)}</td>
                          <td>
                            <span className={`admin_status-badge ${row.status === 'Paid' ? 'completed' : 'pending'}`}>{row.status}</span>
                          </td>
                          <td style={{ color: '#0f172a' }}>{new Date(row.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                          <td style={{ color: '#0f172a' }}>{row.method}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Pagination Component removed for hard-coded view */}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminWallet;


