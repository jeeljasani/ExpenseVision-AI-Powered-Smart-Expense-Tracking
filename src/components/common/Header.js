// src/components/common/Header.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Common.css';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            Bill Analysis App
          </Link>
          
          <nav className="nav">
            {currentUser ? (
              <>
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                <button onClick={handleLogout} className="nav-link nav-button">
                  Logout
                </button>
                <span className="user-welcome">
                  Welcome, {currentUser.username || currentUser.email}
                </span>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="nav-link">Register</Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;