// src/components/common/Footer.js
import React from 'react';
import './Common.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <p>&copy; {new Date().getFullYear()} Bill Analysis App. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;