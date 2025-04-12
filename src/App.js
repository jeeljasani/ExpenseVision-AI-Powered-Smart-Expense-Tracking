// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthContext';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import BillsPage from './components/bills/BillsPage';
import BillDetailPage from './components/bills/BillDetailPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import ApiDebugger from './components/common/ApiDebugger';
import ErrorBoundary from './components/common/ErrorBoundary';
import AnalyticsPage from './components/analytics/AnalyticsPage';
import './App.css';

// Clear invalid localStorage data before rendering
function clearInvalidLocalStorage() {
  try {
    const userStr = localStorage.getItem('user');
    // Test if we can parse it
    if (userStr) {
      try {
        JSON.parse(userStr);
      } catch (err) {
        console.warn('Clearing invalid user data from localStorage');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  } catch (err) {
    console.error('Error accessing localStorage:', err);
  }
}

function App() {
  // Clear invalid localStorage on component mount
  useEffect(() => {
    clearInvalidLocalStorage();
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <div className="app">
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/debug" element={<ApiDebugger />} />
                
                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  
                  {/* Bill-related routes */}
                  <Route path="/bills" element={<BillsPage />} />
                  <Route path="/bills/:billId" element={<BillDetailPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  {/* Add more protected routes here */}
                </Route>
                
                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/login" />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;