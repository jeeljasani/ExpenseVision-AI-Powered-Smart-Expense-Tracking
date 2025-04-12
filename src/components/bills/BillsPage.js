// src/components/bills/BillsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchBills } from '../../services/billService';
import './BillsPage.css';

const BillsPage = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  // Use useCallback to fix the dependency issue
  const loadBills = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading bills...');
      const response = await fetchBills();
      console.log('Bills response in component:', response);
      
      // First, try to extract data directly
      let billsData = [];
      
      if (response.data && response.data.bills) {
        // Success case - data is already in correct format
        billsData = response.data.bills;
      } else if (response.data && typeof response.data.body === 'string') {
        // Case where the body might be a JSON string
        try {
          const parsedBody = JSON.parse(response.data.body);
          if (parsedBody.bills) {
            billsData = parsedBody.bills;
          }
        } catch (e) {
          console.error('Error parsing response body:', e);
        }
      } else if (response.data && response.data.body && response.data.body.bills) {
        // Case where body is already parsed but nested
        billsData = response.data.body.bills;
      } else if (typeof response.data === 'string') {
        // Case where the entire response is a JSON string
        try {
          const parsedData = JSON.parse(response.data);
          if (parsedData.bills) {
            billsData = parsedData.bills;
          } else if (parsedData.body && typeof parsedData.body === 'string') {
            const parsedBody = JSON.parse(parsedData.body);
            if (parsedBody.bills) {
              billsData = parsedBody.bills;
            }
          }
        } catch (e) {
          console.error('Error parsing response as string:', e);
        }
      }
      
      // Log what we found
      console.log('Extracted bills data:', billsData);
      
      if (Array.isArray(billsData) && billsData.length > 0) {
        console.log(`Successfully extracted ${billsData.length} bills`);
        setBills(billsData);
      } else {
        console.warn('No bills found or invalid format');
        setBills([]);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
      
      let errorMessage = 'Failed to load bills. Please try again.';
      
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
        
        if (error.response.status === 403) {
          errorMessage = 'Access denied. Check your permissions.';
        } else if (error.response.status === 401) {
          errorMessage = 'Authentication error. Please log in again.';
          
          // Redirect to login after a delay
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
          }, 3000);
        } else if (error.response.data?.message) {
          errorMessage = `Error: ${error.response.data.message}`;
        }
      }
      
      setError(errorMessage);
      // Initialize with empty array to prevent errors
      setBills([]);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]); // Include navigate in dependencies
  
  useEffect(() => {
    loadBills();
  }, [loadBills]); // Now loadBills is included as a dependency

  // Safely filter bills with null checks
  const filteredBills = filter === 'all' 
    ? bills 
    : (bills || []).filter(bill => {
        if (!bill || !bill.status) return false;
        
        // Handle both uppercase and lowercase status values
        const status = bill.status.toLowerCase();
        return status === filter.toLowerCase();
      });

  // Get a human-readable status with null check
  const getStatusText = (status) => {
    if (!status) return 'Unknown';
    
    const statusLower = status.toLowerCase();
    
    switch(statusLower) {
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  return (
    <div className="bills-page-container">
      <div className="container">
        <div className="bills-header">
          <h1>Your Bills</h1>
          <Link to="/dashboard" className="back-link">
            &larr; Back to Dashboard
          </Link>
        </div>

        <div className="bills-filter">
          <span>Filter by status:</span>
          <div className="filter-options">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${filter === 'processing' ? 'active' : ''}`}
              onClick={() => setFilter('processing')}
            >
              Processing
            </button>
            <button 
              className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Completed
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={loadBills} className="btn btn-secondary">
              Try Again
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="loading-spinner">Loading your bills...</div>
        ) : Array.isArray(bills) && bills.length > 0 ? (
          <div className="bills-grid">
            {filteredBills.map((bill, index) => (
              <Link 
                to={`/bills/${bill.billId || bill.id || index}`} 
                key={bill.billId || bill.id || index} 
                className="bill-card"
              >
                <div className="bill-thumbnail">
                  {bill.thumbnail || bill.fileUrl ? (
                    <img 
                      src={bill.thumbnail || bill.fileUrl} 
                      alt={bill.filename || 'Bill thumbnail'} 
                      onError={(e) => {
                        console.error('Error loading thumbnail');
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzk5OTk5OSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
                      }}
                    />
                  ) : (
                    <div className="placeholder-thumbnail">
                      <i className="fa fa-file-text-o"></i>
                    </div>
                  )}
                </div>
                <div className="bill-details">
                  <h3>{bill.filename || bill.storeName || `Bill #${index + 1}`}</h3>
                  <p className="bill-date">
                    Uploaded on {bill.uploadDate ? new Date(bill.uploadDate).toLocaleDateString() : 'Unknown date'}
                  </p>
                  <span className={`status-badge ${(bill.status || 'unknown').toLowerCase()}`}>
                    {getStatusText(bill.status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No bills found{filter !== 'all' ? ` with status "${filter}"` : ''}.</p>
            {filter !== 'all' ? (
              <button 
                className="btn btn-secondary" 
                onClick={() => setFilter('all')}
              >
                Show all bills
              </button>
            ) : (
              <Link to="/dashboard" className="btn btn-primary">
                Upload your first bill
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BillsPage;