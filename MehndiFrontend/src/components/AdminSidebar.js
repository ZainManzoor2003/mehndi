import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import LogoutButton from './LogoutButton';

const AdminSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const items = [
    {
      id: 'users',
      title: 'Manage Users',
      path: '/admin-dashboard/users',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      )
    },
    {
      id: 'applications',
      title: 'Manage Applications',
      path: '/admin-dashboard/applications',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="14" rx="2" ry="2"/>
          <path d="M7 8h10M7 12h10M7 16h6"/>
        </svg>
      )
    },
    {
      id: 'blogs',
      title: 'Manage Blogs',
      path: '/admin-dashboard/blogs',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
        </svg>
      )
    },
    {
      id: 'bookings',
      title: 'Manage Bookings',
      path: '/admin-dashboard/bookings',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="14" rx="2" ry="2"/>
          <path d="M7 8h10M7 12h10M7 16h6"/>
        </svg>
      )
    },
    {
      id: 'profile',
      title: 'Profile Settings',
      path: '/admin-dashboard/update-profile',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      )
    }
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <div className={`dashboard-sidebar admin-sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="logo-text">Mehndi Me</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            {items.map((item) => (
              <li key={item.id} className="sidebar-item">
                <Link to={item.path} className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`} onClick={onClose}>
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-text">{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="user-details">
              <span className="user-name">Admin</span>
              <span className="user-role">Dashboard</span>
            </div>
          </div>
          <div className="sidebar-logout" style={{ marginTop: '10px' }}>
            <LogoutButton variant="sidebar" />
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;


