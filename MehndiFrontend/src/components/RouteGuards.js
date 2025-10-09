import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Basic auth guard
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Role-based guard
export const RoleProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userType = user?.userType;
  const isAllowed = allowedRoles.length === 0 || (userType && allowedRoles.includes(userType));

  if (!isAllowed) {
    // Redirect to the correct dashboard based on user type
    const fallback =
      userType === 'artist'
        ? '/artist-dashboard'
        : userType === 'admin'
          ? '/admin-dashboard'
          : '/dashboard';

    return <Navigate to={fallback} replace />;

  }

  return children;
};

// Public-only pages (e.g., login) redirect authenticated users to their dashboard
export const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return null;

  if (isAuthenticated) {
    const target = user?.userType === 'artist' ? '/artist-dashboard' : '/dashboard';
    return <Navigate to={target} replace />;
  }

  return children;
};

export default ProtectedRoute;


