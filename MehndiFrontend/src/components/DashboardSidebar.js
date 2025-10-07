import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DashboardSidebar = ({ activeTab, onTabChange, isOpen, onClose, bookingCount = 0 }) => {
  const sidebarItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        </svg>
      )
    },
    {
      id: 'bookings',
      title: 'View All Bookings',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      )
    },
    {
      id: 'proposals',
      title: 'Proposals',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="8" y1="13" x2="16" y2="13"/>
          <line x1="8" y1="17" x2="14" y2="17"/>
        </svg>
      )
    },
    {
      id: 'wallet',
      title: 'Wallet & Payments',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      ),
      path: '/wallet'
    },
    {
      id: 'reviews',
      title: 'Reviews',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
        </svg>
      ),
      path: '/reviews'
    },
    {
      id: 'messages',
      title: 'Messages',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
      path: '/messages'
    },
    {
      id: 'profile',
      title: 'Profile Settings',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
      path: '/profile'
    }
  ];

  const handleItemClick = (itemId) => {
    if (onTabChange) {
      onTabChange(itemId);
    }
    if (onClose) {
      onClose();
    }
  };

  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogoutClick = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      // context logout (in-memory)
      try { await logout(); } catch {}
      // replicate LogoutButton logic
      localStorage.clear();
      // clear common auth cookies
      const deleteCookieEverywhere = (name) => {
        try {
          const hostname = window.location.hostname;
          const parts = hostname.split('.');
          const domains = [];
          for (let i = 0; i < parts.length - 1; i++) { domains.push(parts.slice(i).join('.')); }
          const paths = ['/', window.location.pathname];
          paths.forEach((p) => { document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${p}`; });
          domains.forEach((d) => { paths.forEach((p) => { document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${p};domain=.${d}`; }); });
        } catch {}
      };
      const clearAllCookies = () => {
        try {
          const cookies = document.cookie.split(';');
          for (const cookie of cookies) {
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            deleteCookieEverywhere(name);
          }
        } catch {}
      };
      ['token','jwt','accessToken','authToken'].forEach(deleteCookieEverywhere);
      clearAllCookies();
      navigate('/login', { replace: true });
    } catch {}
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`dashboard-sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="logo-icon" style={{ background: 'transparent', border: 'none', boxShadow: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/assets/logo icon.png" alt="Mehndi Me" style={{ width: 'auto', height: 'auto', display: 'block', borderRadius: '50%' }} />
            </div>
            <span className="logo-text" style={{ display: 'inline-block' }}>
              <img src="/assets/logo text.png" alt="Mehndi Me" style={{ height: 22, display: 'block' }} />
            </span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            {sidebarItems.map((item) => (
              <li key={item.id} className="sidebar-item">
                <button
                  className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => handleItemClick(item.id)}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-text">{item.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="user-details">
              <span className="user-name">Client</span>
              <span className="user-role">Dashboard</span>
            </div>
          </div>
          <div className="sidebar-logout">
            <Link to="/login" className="sidebar-logout-btn" onClick={handleLogoutClick}>Logout</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardSidebar;
