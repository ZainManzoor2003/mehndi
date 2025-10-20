import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LogoutButton from './LogoutButton';
import './admin-theme.css';

const AdminSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const [user, setUser] = useState(null);

  // Get user info from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }, []);

  // Apply admin theme on admin routes
  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith('/admin-dashboard');
    if (isAdminRoute) {
      document.body.classList.add('admin-theme');
    } else {
      document.body.classList.remove('admin-theme');
    }
    return () => {
      document.body.classList.remove('admin-theme');
    };
  }, [location.pathname]);

  const items = [
    {
      id: 'clients',
      title: 'Manage Clients',
      path: '/admin-dashboard/manage-clients',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      )
    },
    {
      id: 'artists',
      title: 'Manage Artists',
      path: '/admin-dashboard/manage-artists',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      )
    },
    {
      id: 'admins',
      title: 'Manage Admins',
      path: '/admin-dashboard/manage-admins',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 15l-3-3 3-3"/>
          <path d="M8 12h8"/>
          <circle cx="12" cy="12" r="10"/>
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
      id: 'analytics',
      title: 'Reports & Analytics',
      path: '/admin-dashboard/analytics',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18"/>
          <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
        </svg>
      )
    },
    {
      id: 'transactions',
      title: 'Transactions',
      path: '/admin-dashboard/wallet',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="6" width="20" height="12" rx="2" ry="2"/>
          <circle cx="16" cy="12" r="2"/>
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
        {/* <div className="sidebar-header">
          <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div className="logo-icon" style={{ background: 'transparent', border: 'none', boxShadow: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/assets/logo icon.png" alt="Mehndi Me" style={{ width: 'auto', height: 'auto', display: 'block', borderRadius: '50%' }} />
            </div>
            <span className="logo-text" style={{ display: 'inline-block' }}>
              <img src="/assets/logo text.png" alt="Mehndi Me" style={{ height: 22, display: 'block' }} />
            </span>
          </div>
        </div> */}

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
          {/* {user && user.userType === 'admin' && (
            <div className="user-info" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              marginBottom: '12px'
            }}>
              <div className="user-avatar" style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div className="user-details" style={{ flex: 1, minWidth: 0 }}>
                <div className="user-name" style={{
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {user.firstName} {user.lastName}
                </div>
                <div className="user-role" style={{
                  color: '#9ca3af',
                  fontSize: '0.75rem',
                  textTransform: 'capitalize'
                }}>
                  {user.userType}
                </div>
              </div>
            </div>
          )} */}
          <div className="sidebar-logout">
            <LogoutButton variant="sidebar" />
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;


