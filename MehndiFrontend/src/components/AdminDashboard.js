import React, { useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { adminAPI } from '../services/api';

const Stat = ({ label, value }) => (
  <div className="stat-card">
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminAPI.getApplicationStatusSummary();
        setStats(res.data || []);
      } catch (e) {
        console.error(e);
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
          <main className="dashboard-content">
        <h2>Admin Dashboard</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="stats-grid">
            {stats.map((s) => (
              <Stat key={s.status} label={s.status} value={s.count} />
            ))}
          </div>
        )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;



