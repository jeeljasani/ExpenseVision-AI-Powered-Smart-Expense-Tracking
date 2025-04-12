// src/components/auth/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Safe localStorage check - this is the key fix
    try {
      const userStr = localStorage.getItem('user');
      if (userStr && userStr !== 'undefined') {
        try {
          const user = JSON.parse(userStr);
          setCurrentUser(user);
        } catch (err) {
          console.error('Error parsing user data from localStorage:', err);
          // Invalid JSON in localStorage, clear it
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
    } catch (err) {
      console.error('Error accessing localStorage:', err);
    }
    
    setLoading(false);
  }, []);

  const register = async (userData) => {
    try {
      setError('');
      const response = await authService.register(userData);
      return response.data;
    } catch (err) {
      console.error('Registration error:', err);
      if (err.code === 'ERR_NETWORK') {
        setError('Network error: Please check if CORS is enabled on the API server');
      } else {
        setError(err.response?.data?.message || 'Registration failed');
      }
      throw err;
    }
  };

  const login = async (credentials) => {
    try {
      setError('');
      console.log('Login credentials:', credentials);
      
      const response = await authService.login(credentials);
      console.log('Login response:', response);
      
      // Safety checks on response data
      if (!response || !response.data) {
        throw new Error('Invalid response: No data received');
      }
      
      let data = response.data;
      console.log('Login data:', data);
      
      // Check if data is a string (JSON inside body)
      if (data.body && typeof data.body === 'string') {
        try {
          // Parse the JSON string in the body
          const bodyData = JSON.parse(data.body);
          // Use this parsed data instead
          data = bodyData;
        } catch (e) {
          console.error('Error parsing body JSON:', e);
        }
      }
      
      // Flexible handling of response structure
      const token = data.token || data.accessToken || '';
      
      // Create a safe user object - fallback if user object not provided
      const user = data.user || { 
        name: data.name,
        email: data.email || credentials.email 
      };
      
      if (!token) {
        throw new Error('Invalid response: No token received');
      }
      
      // Store data safely
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setCurrentUser(user);
      return user;
    } catch (err) {
      console.error('Login error:', err);
      if (err.code === 'ERR_NETWORK') {
        setError('Network error: Please check if CORS is enabled on the API server');
      } else if (err.message && err.message.includes('JSON')) {
        setError('Error parsing response: Invalid data received from server');
      } else {
        setError(err.response?.data?.message || 'Login failed');
      }
      throw err;
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setCurrentUser(null);
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};