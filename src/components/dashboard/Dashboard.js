// src/components/dashboard/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { uploadBill, fetchBills } from '../../services/billService';
import ExpenseDashboard from '../analytics/ExpenseDashboard';
import './Dashboard.css';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    setIsLoading(true);
    try {
      const response = await fetchBills();
      if (response && response.data && response.data.bills) {
        setBills(response.data.bills);
      } else {
        setBills([]);
        console.warn('No bills data in response', response);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
      setBills([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // Clear any previous error message when a new file is selected
      setUploadMessage(null);
    }
  };

const handleUpload = async () => {
  if (!file) {
    setUploadMessage({ type: 'error', text: 'Please select a file first' });
    return;
  }

  setIsUploading(true);
  setUploadMessage(null);

  try {
    // Create FormData object
    const formData = new FormData();
    formData.append('bill', file);
    
    console.log('Uploading file:', file.name, 'size:', file.size);
    
    // Attempt to upload
    const response = await uploadBill(formData);
    
    console.log('Upload response:', response);
    
    if (response && response.data) {
      setUploadMessage({ 
        type: 'success', 
        text: 'Your bill was successfully uploaded! It is now being processed.' 
      });
      
      // Refresh the bills list
      setTimeout(() => {
        loadBills();
      }, 2000); // Give backend a moment to process
    } else {
      throw new Error('Invalid response from server');
    }
    
    // Reset file selection
    setFile(null);
    document.getElementById('bill-upload').value = '';
  } catch (error) {
    console.error('Error uploading bill:', error);
    
    // More detailed error message based on the response
    let errorMessage = 'Failed to upload bill. Please try again.';
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      
      if (error.response.status === 401 || error.response.data?.message === 'Missing Authentication Token') {
        errorMessage = 'Authentication error. Please log in again.';
        // You might want to redirect to login here
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userId');
          navigate('/login');
        }, 3000);
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      errorMessage = 'No response from server. Please check your connection.';
    }
    
    setUploadMessage({ 
      type: 'error', 
      text: errorMessage
    });
  } finally {
    setIsUploading(false);
  }
};

  // Calculate statistics
  const pendingBills = bills.filter(bill => bill.status === 'PROCESSING').length;
  const analyzedBills = bills.filter(bill => bill.status === 'COMPLETED').length;

  return (
    <div className="dashboard-container">
      <div className="container">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-welcome">Welcome back, {currentUser?.name || currentUser?.email || 'User'}!</p>
        
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Total Bills</h3>
            <p className="stat-value">{isLoading ? '...' : bills.length}</p>
          </div>
          <div className="stat-card">
            <h3>Analyzed</h3>
            <p className="stat-value">{isLoading ? '...' : analyzedBills}</p>
          </div>
          <div className="stat-card">
            <h3>Pending</h3>
            <p className="stat-value">{isLoading ? '...' : pendingBills}</p>
          </div>
        </div>
        
        <div className="upload-section">
          <h2>Upload New Bill</h2>
          <p>Upload your bills to analyze them automatically.</p>
          
          <div className="file-upload-container">
            <input 
              type="file" 
              id="bill-upload" 
              accept="image/png, image/jpeg, image/jpg, application/pdf" 
              onChange={handleFileChange} 
              className="file-input"
            />
            <label htmlFor="bill-upload" className="file-label">
              {file ? file.name : 'Choose file'}
            </label>
            <button 
              className="btn btn-primary upload-btn" 
              onClick={handleUpload} 
              disabled={isUploading || !file}
            >
              {isUploading ? 'Uploading...' : 'Upload Bill'}
            </button>
          </div>
          
          {uploadMessage && (
            <div className={`upload-message ${uploadMessage.type}`}>
              {uploadMessage.text}
            </div>
          )}
        </div>
        
        {/* Expense Dashboard Component */}
        <ExpenseDashboard />
        
        <div className="recent-bills">
          <h2>Recent Bills</h2>
          <div className="view-all-link">
            <a href="/bills">View All Bills</a>
          </div>
          
          {isLoading ? (
            <p>Loading your bills...</p>
          ) : bills.length > 0 ? (
            <div className="bills-list">
              {bills.slice(0, 5).map(bill => (
                <div key={bill.id} className="bill-item">
                  <div className="bill-info">
                    <h3>{bill.filename || 'Bill'}</h3>
                    <p>Uploaded on {new Date(bill.uploadDate).toLocaleDateString()}</p>
                  </div>
                  <div className="bill-status">
                    <span className={`status-badge ${bill.status.toLowerCase()}`}>
                      {bill.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>You haven't uploaded any bills yet.</p>
              <p>Upload your first bill to get started with the analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;