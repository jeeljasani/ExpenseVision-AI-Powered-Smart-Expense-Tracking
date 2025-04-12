// src/components/bills/BillDetailPage.js - UPDATED
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  fetchBillById, 
  fetchBillData, 
  fetchBillByIdDirect, 
  fetchBillDataDirect 
} from '../../services/billService';
import './BillDetailPage.css';

const BillDetailPage = () => {
  const { billId } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [billData, setBillData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (billId) {
      console.log(`BillDetailPage: Loading details for bill ID: ${billId}`);
      loadBillDetails();
    } else {
      console.error('BillDetailPage: No billId found in URL parameters');
      setError('Invalid bill ID');
      setIsLoading(false);
    }
  }, [billId]);

  const loadBillDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading bill details for ID:', billId);
      
      // Load bill metadata - USE DIRECT METHOD INSTEAD OF PATH PARAMETER
      const billResponse = await fetchBillByIdDirect(billId);
      console.log('Bill details response:', billResponse);
      
      if (!billResponse || !billResponse.data) {
        throw new Error('Invalid response when fetching bill details');
      }
      
      if (!billResponse.data.data) {
        console.error('Unexpected response structure:', billResponse.data);
        throw new Error('Unexpected response structure from API');
      }
      
      // Set bill data
      setBill(billResponse.data.data);
      
      // If bill is completed, fetch analysis data
      const status = billResponse.data.data.status || '';
      if (status.toUpperCase() === 'COMPLETED' || status.toLowerCase() === 'completed') {
        setIsLoadingData(true);
        
        try {
          console.log('Fetching bill analysis data');
          // USE DIRECT METHOD INSTEAD OF PATH PARAMETER
          const dataResponse = await fetchBillDataDirect(billId);
          console.log('Bill data response:', dataResponse);
          
          if (dataResponse && dataResponse.data && dataResponse.data.data) {
            console.log('Setting bill data from response');
            setBillData(dataResponse.data.data);
          } else {
            console.warn('Invalid bill data response');
            
            // Use the bill metadata we already have to create a fallback
            const fallbackData = {
              ...billResponse.data.data,
              storeName: billResponse.data.data.storeName || 'Not detected',
              purchaseDate: billResponse.data.data.purchaseDate || 'Not detected',
              storePhone: 'Not detected',
              accountNumber: 'Not detected',
              totalAmount: billResponse.data.data.totalAmount || '0.00',
              subtotal: billResponse.data.data.subtotal || '0.00',
              discount: billResponse.data.data.discount || '0.00'
            };
            
            console.log('Created fallback data:', fallbackData);
            setBillData(fallbackData);
          }
        } catch (dataError) {
          console.error('Error fetching bill data:', dataError);
          
          // Use the bill metadata we already have
          setBillData({
            ...billResponse.data.data,
            storeName: billResponse.data.data.storeName || 'Not detected',
            purchaseDate: billResponse.data.data.purchaseDate || 'Not detected',
            storePhone: 'Not detected',
            accountNumber: 'Not detected',
            totalAmount: '0.00',
            subtotal: '0.00',
            discount: '0.00'
          });
        } finally {
          setIsLoadingData(false);
        }
      }
    } catch (error) {
      console.error('Error fetching bill details:', error);
      
      let errorMessage = 'Failed to load bill details. Please try again later.';
      
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
        
        if (error.response.status === 404) {
          errorMessage = 'Bill not found. It may have been deleted.';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to view this bill.';
        } else if (error.response.status === 401) {
          errorMessage = 'Authentication error. Please log in again.';
          
          // Redirect to login after a delay
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
          }, 3000);
        } else if (error.response.status === 400) {
          errorMessage = `Error: ${error.response.data.message || 'Bad request'}`;
        } else if (error.response.status === 500 && 
                  error.response.data?.error?.includes('key element does not match the schema')) {
          errorMessage = 'Database error: The bill ID format is not valid for this database.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // The rest of the component remains the same
  if (isLoading) {
    return (
      <div className="bill-detail-container">
        <div className="container">
          <div className="loading-spinner">Loading bill details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bill-detail-container">
        <div className="container">
          <div className="error-message">
            <h2>Error</h2>
            <p>{error}</p>
            <Link to="/bills" className="btn btn-primary">
              Back to Bills
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="bill-detail-container">
        <div className="container">
          <div className="error-message">
            <h2>Bill Not Found</h2>
            <p>The bill you're looking for doesn't exist or has been removed.</p>
            <Link to="/bills" className="btn btn-primary">
              Back to Bills
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    try {
      const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Get appropriate status message
  const getStatusMessage = () => {
    if (!bill.status) return '';
    
    const status = bill.status.toLowerCase();
    
    switch(status) {
      case 'processing':
        return 'Your bill is currently being processed. This may take a few minutes.';
      case 'completed':
        return 'Analysis complete! Review the extracted data below.';
      case 'failed':
        return 'We encountered an error processing this bill. Please try uploading it again.';
      default:
        return '';
    }
  };

  // Safe status check - handle both lowercase and uppercase status values
  const billStatus = bill.status ? bill.status.toLowerCase() : 'unknown';
  const isCompleted = billStatus === 'completed' || bill.status === 'COMPLETED';

  // Component render remains the same
  return (
    <div className="bill-detail-container">
      <div className="container">
        <div className="bill-detail-header">
          <div className="header-left">
            <Link to="/bills" className="back-link">
              &larr; Back to Bills
            </Link>
            <h1>{bill.storeName || bill.filename || `Bill #${billId.substring(0, 8)}`}</h1>
          </div>
          <div className="header-right">
            <span className={`status-badge ${billStatus}`}>
              {bill.status || 'Unknown'}
            </span>
            <button 
              onClick={loadBillDetails} 
              className="btn btn-secondary refresh-btn"
              title="Refresh bill data"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="status-message">
          <p>{getStatusMessage()}</p>
        </div>

        {billStatus === 'processing' && (
          <div className="processing-info">
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
            <p>This typically takes 1-3 minutes. You can refresh the page to check progress.</p>
          </div>
        )}

        <div className="bill-content">
          <div className="bill-tabs">
            <button 
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`tab-btn ${activeTab === 'original' ? 'active' : ''}`}
              onClick={() => setActiveTab('original')}
            >
              Original Bill
            </button>
            {isCompleted && (
              <button 
                className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
                onClick={() => setActiveTab('analysis')}
              >
                Analysis Results
              </button>
            )}
          </div>

          <div className="tab-content">
            {activeTab === 'overview' && (
              <div className="overview-tab">
                <div className="info-cards">
                  <div className="info-card">
                    <h3>Upload Date</h3>
                    <p>{formatDate(bill.uploadDate)}</p>
                  </div>
                  <div className="info-card">
                    <h3>File Name</h3>
                    <p>{bill.filename || 'Not available'}</p>
                  </div>
                  <div className="info-card">
                    <h3>File Type</h3>
                    <p>{bill.fileType || 'Not available'}</p>
                  </div>
                  <div className="info-card">
                    <h3>File Size</h3>
                    <p>{bill.fileSize ? `${(bill.fileSize / 1024).toFixed(2)} KB` : 'Not available'}</p>
                  </div>
                </div>

                {isCompleted && billData && (
                  <div className="summary-section">
                    <h2>Bill Summary</h2>
                    <div className="summary-cards">
                      <div className="summary-card">
                        <h3>Total Amount</h3>
                        <p className="summary-value">${billData.totalAmount || '0.00'}</p>
                      </div>
                      <div className="summary-card">
                        <h3>Date</h3>
                        <p>{billData.purchaseDate || 'Not detected'}</p>
                      </div>
                      <div className="summary-card">
                        <h3>Vendor</h3>
                        <p>{billData.storeName || 'Not detected'}</p>
                      </div>
                      <div className="summary-card">
                        <h3>Subtotal</h3>
                        <p>${billData.subtotal || '0.00'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'original' && (
              <div className="original-tab">
                {bill.fileUrl ? (
                  <div className="bill-image-container">
                    <img 
                      src={bill.fileUrl} 
                      alt={bill.filename || 'Bill image'} 
                      className="bill-image"
                      onError={(e) => {
                        console.error('Error loading image');
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzk5OTk5OSI+SW1hZ2UgTm90IEF2YWlsYWJsZTwvdGV4dD48L3N2Zz4=';
                      }}
                    />
                  </div>
                ) : (
                  <div className="no-preview">
                    <p>No preview available</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analysis' && isCompleted && (
              <div className="analysis-tab">
                {isLoadingData ? (
                  <div className="loading-spinner">Loading analysis data...</div>
                ) : billData ? (
                  <>
                    <div className="extracted-data">
                      <h2>Store Information</h2>
                      <table className="data-table">
                        <tbody>
                          <tr>
                            <td>Store Name</td>
                            <td>{billData.storeName || 'Not detected'}</td>
                          </tr>
                          <tr>
                            <td>Store Phone</td>
                            <td>{billData.storePhone || 'Not detected'}</td>
                          </tr>
                          <tr>
                            <td>Purchase Date</td>
                            <td>{billData.purchaseDate || 'Not detected'}</td>
                          </tr>
                          <tr>
                            <td>Account Number</td>
                            <td>{billData.accountNumber || 'Not detected'}</td>
                          </tr>
                        </tbody>
                      </table>
                      
                      <h2>Payment Information</h2>
                      <table className="data-table">
                        <tbody>
                          <tr>
                            <td>Total Amount</td>
                            <td>${billData.totalAmount || '0.00'}</td>
                          </tr>
                          <tr>
                            <td>Subtotal</td>
                            <td>${billData.subtotal || '0.00'}</td>
                          </tr>
                          <tr>
                            <td>Discount</td>
                            <td>${billData.discount || '0.00'}</td>
                          </tr>
                          {billData.paymentDetails && (
                            <>
                              <tr>
                                <td>Card Type</td>
                                <td>{billData.paymentDetails.cardType || 'Not detected'}</td>
                              </tr>
                              <tr>
                                <td>Card Number</td>
                                <td>{billData.paymentDetails.cardNumber || 'Not detected'}</td>
                              </tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Handle updated items */}
                    {billData.updatedItems && Array.isArray(billData.updatedItems) && billData.updatedItems.length > 0 && (
                      <div className="line-items">
                        <h2>Categorized Items</h2>
                        <table className="line-items-table">
                          <thead>
                            <tr>
                              <th>Item Name</th>
                              <th>Price</th>
                              <th>Category</th>
                            </tr>
                          </thead>
                          <tbody>
                            {billData.updatedItems.map((item, index) => (
                              <tr key={index}>
                                <td>{item.itemName || 'N/A'}</td>
                                <td>${item.itemPrice || 'N/A'}</td>
                                <td>{item.category || 'Uncategorized'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    
                    {/* Handle regular items if no updated items are available */}
                    {(!billData.updatedItems || billData.updatedItems.length === 0) && 
                     billData.items && Array.isArray(billData.items) && billData.items.length > 0 && (
                      <div className="line-items">
                        <h2>Items</h2>
                        <table className="line-items-table">
                          <thead>
                            <tr>
                              <th>Item Name</th>
                              <th>Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {billData.items.map((item, index) => (
                              <tr key={index}>
                                <td>{item.itemName || 'N/A'}</td>
                                <td>${item.itemPrice || 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="no-data">
                    <p>Analysis data is not available yet.</p>
                    <button onClick={loadBillDetails} className="btn btn-secondary">
                      Refresh Data
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillDetailPage;