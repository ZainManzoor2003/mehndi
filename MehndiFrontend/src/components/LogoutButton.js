import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const deleteCookieEverywhere = (name) => {
  try {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    const domains = [];
    for (let i = 0; i < parts.length - 1; i++) {
      domains.push(parts.slice(i).join('.'));
    }
    const paths = ['/', window.location.pathname];

    // Current host without domain attribute
    paths.forEach((p) => {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${p}`;
    });

    // All parent domains
    domains.forEach((d) => {
      paths.forEach((p) => {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${p};domain=.${d}`;
      });
    });
  } catch {}
};

const clearAllCookies = () => {
  if (typeof document === 'undefined') return;
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      deleteCookieEverywhere(name);
    }
  } catch {}
};

const LogoutButton = ({ variant = 'floating', className = '' }) => {
  const navigate = useNavigate();
  const { logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  const handleLogout = async () => {
    // Client-side logout only
    try { await logout(); } catch {}
    try { localStorage.clear(); } catch {}
    ['token', 'jwt', 'accessToken', 'authToken'].forEach(deleteCookieEverywhere);
    clearAllCookies();
    navigate('/login', { replace: true });
  };

  if (variant === 'sidebar') {
    return (
      <button onClick={handleLogout} className={`sidebar-logout-btn ${className}`}>
        Logout
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        position: 'fixed',
        top: '12px',
        right: '24px',
        zIndex: 1000,
        background: '#d4a574',
        color: '#fff',
        border: 'none',
        padding: '8px 12px',
        borderRadius: '6px',
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
      }}
      aria-label="Logout"
      title="Logout"
    >
      Logout
    </button>
  );
};

export default LogoutButton;


