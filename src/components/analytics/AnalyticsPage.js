// src/components/analytics/AnalyticsPage.js
import React from 'react';
import ExpenseAnalytics from './ExpenseAnalytics';
import './AnalyticsPage.css';

const AnalyticsPage = () => {
  // Simple function that uses window.location for navigation
  const goToDashboard = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="analytics-page-container">
      <div className="container">
        <div className="analytics-header">
          <h1>Expense Analytics</h1>
          {/* Direct dashboard navigation using plain JS */}
          <button 
            onClick={goToDashboard} 
            className="back-link"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#5469d4',
              textDecoration: 'none',
              fontWeight: '500',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            &larr; Back to Dashboard
          </button>
        </div>

        <div className="analytics-description">
          <p>
            Track and analyze your spending patterns over time. View weekly and monthly 
            breakdowns of your expenses by category to better understand where your money goes.
          </p>
        </div>

        <ExpenseAnalytics />

        <div className="analytics-tips">
          <h3>Tips for Better Financial Tracking</h3>
          <ul>
            <li>Upload all your receipts and bills to get a complete picture of your expenses</li>
            <li>Categorize your expenses to better understand your spending habits</li>
            <li>Compare weekly and monthly trends to identify saving opportunities</li>
            <li>Set budget limits for each category to manage your finances effectively</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;