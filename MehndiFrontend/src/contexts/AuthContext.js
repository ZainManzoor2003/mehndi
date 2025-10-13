import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const { authAPI } = apiService;

// Helper function to update localStorage and state
const updateAuthState = (user, isAuthenticated, setUser, setIsAuthenticated) => {
  if (isAuthenticated && user) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('isAuthenticated', 'true');
    console.log('Auth state saved to localStorage:', { user: user.firstName + ' ' + user.lastName, userType: user.userType });
  } else {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    console.log('Auth state cleared from localStorage');
  }
  
  setUser(user);
  setIsAuthenticated(isAuthenticated);
};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Initialize user from localStorage with error handling
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
        return JSON.parse(savedUser);
      }
      return null;
    } catch (error) {
      console.error('Error parsing saved user from localStorage:', error);
      // Clear corrupted data
      localStorage.removeItem('user');
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Initialize auth state from localStorage with validation
    try {
      const savedAuth = localStorage.getItem('isAuthenticated');
      const savedToken = localStorage.getItem('token');
      // Only consider authenticated if both auth flag and token exist
      return savedAuth === 'true' && savedToken && savedToken !== 'undefined' && savedToken !== 'null';
    } catch (error) {
      console.error('Error reading auth state from localStorage:', error);
      return false;
    }
  });

  // Check if user is already logged in on app start
  useEffect(() => {
    // If checkAuthStatus is not called, we still need to set loading to false
    // Otherwise routes will be stuck in loading state
    setLoading(false);
    // Uncomment below to enable auth check on app start
    // checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getProfile();
      
      // Save user to localStorage
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('isAuthenticated', 'true');
      
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.log('User not authenticated:', error);
      
      // Clear localStorage on auth failure
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      
      // Save token and user to localStorage on successful login
      if (response.token) {
        localStorage.setItem('token', response.token);
      }
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('isAuthenticated', 'true');
      
      setUser(response.data.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      // Clear localStorage on login failure
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear localStorage on logout
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      // Don't automatically log in after registration
      // User needs to verify email first
      return response;
    } catch (error) {
      throw error;
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    localStorage.setItem('isAuthenticated', 'true');
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    register,
    checkAuthStatus,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 