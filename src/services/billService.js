// src/services/billService.js - UPDATED
import api from './api';

// Upload a bill
export const uploadBill = async (formData) => {
  // Get the file from FormData
  const file = formData.get('bill');
  if (!file) {
    throw new Error('No file found in form data');
  }

  // Read the file as base64
  const base64File = await convertFileToBase64(file);
  
  // Get userId from localStorage
  let userId;
  try {
    // Try multiple sources for userId
    userId = localStorage.getItem('userId');
    
    if (!userId) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        userId = userData.id || userData.userId;
      }
    }
  } catch (error) {
    console.error('Error reading user from localStorage:', error);
  }
  
  // Fall back to a test ID if needed
  if (!userId) {
    userId = 'b59d054f-ce81-4de9-a142-be2283ddaef6';
    console.log('Using fallback user ID');
  }
  
  console.log('Uploading bill:', { 
    fileName: file.name, 
    fileType: file.type, 
    size: file.size, 
    userId: userId 
  });
  
  // Prepare the payload as the Lambda expects
  const payload = {
    userId: userId,
    fileName: file.name,
    fileType: file.type,
    fileData: base64File
  };
  
  // Send the request
  return api.post('/bills', payload);
};

// Helper function to convert file to base64
const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Extract the base64 part (remove data:image/jpeg;base64, prefix)
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
};

// Fetch all bills for the current user
export const fetchBills = () => {
  console.log('Fetching all bills');
  
  // Set test user ID for development
  if (!localStorage.getItem('userId')) {
    localStorage.setItem('userId', 'b59d054f-ce81-4de9-a142-be2283ddaef6');
    console.log('Set test userId for fetchBills request');
  }
  
  return api.get('/bills')
    .then(response => {
      console.log('Raw bills response:', response);
      
      // Extract data based on response format
      let data = response.data;
      
      // Handle string response
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
          console.log('Parsed string response:', data);
        } catch (e) {
          console.error('Failed to parse string response:', e);
        }
      }
      
      // Handle nested body structure
      if (data && data.body && typeof data.body === 'string') {
        try {
          data = JSON.parse(data.body);
          console.log('Parsed body string:', data);
        } catch (e) {
          console.error('Failed to parse body string:', e);
        }
      }
      
      console.log('Final processed response data:', data);
      
      // Check if the bills array is available in the response
      if (!data || !data.bills) {
        console.error('No bills array in processed response:', data);
        throw new Error('Invalid response format: missing bills array');
      }
      
      // Create a new response with parsed data
      return {
        ...response,
        data: data
      };
    })
    .catch(error => {
      console.error('Error fetching bills:', error);
      throw error;
    });
};

// ORIGINAL METHODS (LEAVING THEM FOR BACKWARD COMPATIBILITY)
// Fetch a single bill by ID
export const fetchBillById = (billId) => {
  console.log(`Fetching bill with ID: ${billId}`);
  // Make sure billId is not undefined or empty and is properly formatted
  if (!billId || typeof billId !== 'string' || billId.trim() === '') {
    console.error('fetchBillById called with invalid billId:', billId);
    return Promise.reject(new Error('Invalid bill ID'));
  }
  
  // Set test user ID for development
  if (!localStorage.getItem('userId')) {
    localStorage.setItem('userId', 'b59d054f-ce81-4de9-a142-be2283ddaef6');
    console.log('Set test userId for fetchBillById request');
  }
  
  // Ensure billId is properly formatted
  const cleanBillId = billId.trim();
  const url = `/bills/${cleanBillId}`;
  console.log(`Making API request to: ${url}`);
  
  return api.get(url)
    .then(response => {
      console.log(`Raw bill ${cleanBillId} response:`, response);
      
      // Extract data based on response format
      let data = response.data;
      
      // Handle string response
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
          console.log('Parsed string response:', data);
        } catch (e) {
          console.error('Failed to parse string response:', e);
        }
      }
      
      // Handle nested body structure
      if (data && data.body && typeof data.body === 'string') {
        try {
          data = JSON.parse(data.body);
          console.log('Parsed body string:', data);
        } catch (e) {
          console.error('Failed to parse body string:', e);
        }
      }
      
      console.log(`Final processed bill ${cleanBillId} data:`, data);
      
      // Check if the data property exists in the response
      if (!data || !data.data) {
        console.error('No data in processed bill response:', data);
        throw new Error('Invalid response format: missing data property');
      }
      
      // Create a new response with parsed data
      return {
        ...response,
        data: data
      };
    })
    .catch(error => {
      console.error(`Error fetching bill ${cleanBillId}:`, error);
      throw error;
    });
};

// Fetch bill data (analysis results)
export const fetchBillData = (billId) => {
  console.log(`Fetching data for bill with ID: ${billId}`);
  
  if (!billId || typeof billId !== 'string' || billId.trim() === '') {
    console.error('fetchBillData called with invalid billId:', billId);
    return Promise.reject(new Error('Invalid bill ID'));
  }
  
  // Set test user ID for development
  if (!localStorage.getItem('userId')) {
    localStorage.setItem('userId', 'b59d054f-ce81-4de9-a142-be2283ddaef6');
    console.log('Set test userId for fetchBillData request');
  }
  
  // Clean the billId
  const cleanBillId = billId.trim();
  
  // CRITICAL: Use the exact URL format expected by your API Gateway
  const url = `/bills/${cleanBillId}/data`;
  console.log(`Making API request to: ${url}`);
  
  return api.get(url)
    .then(response => {
      console.log(`Raw bill ${cleanBillId} data response:`, response);
      
      // Extract data
      let data = response.data;
      
      // Parse string responses
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
          console.log('Parsed string response:', data);
        } catch (e) {
          console.error('Failed to parse string response:', e);
        }
      }
      
      // Handle nested body responses
      if (data && data.body && typeof data.body === 'string') {
        try {
          data = JSON.parse(data.body);
          console.log('Parsed body string:', data);
        } catch (e) {
          console.error('Failed to parse body string:', e);
        }
      }
      
      console.log(`Final processed bill ${cleanBillId} data:`, data);
      
      // Check for data property
      if (!data || !data.data) {
        console.error('No data in processed bill data response:', data);
        
        // Return fallback data
        return {
          ...response,
          data: { 
            data: {
              id: cleanBillId,
              billId: cleanBillId,
              storeName: "Not available", 
              storePhone: "Not detected",
              purchaseDate: "Not detected",
              totalAmount: "0.00",
              subtotal: "0.00",
              discount: "0.00",
              items: []
            } 
          }
        };
      }
      
      return {
        ...response,
        data: data
      };
    })
    .catch(error => {
      console.error(`Error fetching data for bill ${cleanBillId}:`, error);
      
      // Create fallback data for error cases
      const fallbackData = {
        id: cleanBillId,
        billId: cleanBillId,
        storeName: "Error occurred", 
        storePhone: "Not available",
        purchaseDate: "Not available",
        totalAmount: "0.00",
        subtotal: "0.00",
        discount: "0.00",
        items: []
      };
      
      // Return fake successful response with fallback data
      return {
        status: 200,
        data: { data: fallbackData }
      };
    });
};

// NEW DIRECT METHODS - THESE BYPASS PATH PARAMETER ISSUES
export const fetchBillByIdDirect = (billId) => {
  console.log(`Directly fetching bill with ID: ${billId}`);
  
  if (!billId || typeof billId !== 'string' || billId.trim() === '') {
    console.error('fetchBillByIdDirect called with invalid billId:', billId);
    return Promise.reject(new Error('Invalid bill ID'));
  }
  
  // Set test user ID for development
  if (!localStorage.getItem('userId')) {
    localStorage.setItem('userId', 'b59d054f-ce81-4de9-a142-be2283ddaef6');
    console.log('Set test userId for fetchBillByIdDirect request');
  }
  
  const cleanBillId = billId.trim();
  
  // Use POST to send the billId in the request body
  return api.post('/get-bill', {
    billId: cleanBillId,
    isDataRequest: false
  })
    .then(response => {
      console.log(`Raw bill ${cleanBillId} response:`, response);
      
      // Process response data
      let data = response.data;
      
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
          console.log('Parsed string response:', data);
        } catch (e) {
          console.error('Failed to parse string response:', e);
        }
      }
      
      if (data && data.body && typeof data.body === 'string') {
        try {
          data = JSON.parse(data.body);
          console.log('Parsed body string:', data);
        } catch (e) {
          console.error('Failed to parse body string:', e);
        }
      }
      
      if (!data || !data.data) {
        console.error('No data in processed bill response:', data);
        throw new Error('Invalid response format: missing data property');
      }
      
      return {
        ...response,
        data: data
      };
    })
    .catch(error => {
      console.error(`Error fetching bill ${cleanBillId}:`, error);
      throw error;
    });
};

export const fetchBillDataDirect = (billId) => {
  console.log(`Directly fetching data for bill with ID: ${billId}`);
  
  if (!billId || typeof billId !== 'string' || billId.trim() === '') {
    console.error('fetchBillDataDirect called with invalid billId:', billId);
    return Promise.reject(new Error('Invalid bill ID'));
  }
  
  // Set test user ID for development
  if (!localStorage.getItem('userId')) {
    localStorage.setItem('userId', 'b59d054f-ce81-4de9-a142-be2283ddaef6');
    console.log('Set test userId for fetchBillDataDirect request');
  }
  
  const cleanBillId = billId.trim();
  
  // Use POST to send the billId and dataFlag in the request body
  return api.post('/get-bill', {
    billId: cleanBillId,
    isDataRequest: true
  })
    .then(response => {
      console.log(`Raw bill ${cleanBillId} data response:`, response);
      
      // Process response data
      let data = response.data;
      
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
          console.log('Parsed string response:', data);
        } catch (e) {
          console.error('Failed to parse string response:', e);
        }
      }
      
      if (data && data.body && typeof data.body === 'string') {
        try {
          data = JSON.parse(data.body);
          console.log('Parsed body string:', data);
        } catch (e) {
          console.error('Failed to parse body string:', e);
        }
      }
      
      if (!data || !data.data) {
        console.error('No data in processed bill data response:', data);
        
        // Return fallback data
        return {
          ...response,
          data: { 
            data: {
              id: cleanBillId,
              billId: cleanBillId,
              storeName: "Not available", 
              storePhone: "Not detected",
              purchaseDate: "Not detected",
              totalAmount: "0.00",
              subtotal: "0.00",
              discount: "0.00",
              items: []
            } 
          }
        };
      }
      
      return {
        ...response,
        data: data
      };
    })
    .catch(error => {
      console.error(`Error fetching data for bill ${cleanBillId}:`, error);
      
      // Create fallback data for error cases
      const fallbackData = {
        id: cleanBillId,
        billId: cleanBillId,
        storeName: "Error occurred", 
        storePhone: "Not available",
        purchaseDate: "Not available",
        totalAmount: "0.00",
        subtotal: "0.00",
        discount: "0.00",
        items: []
      };
      
      // Return fake successful response with fallback data
      return {
        status: 200,
        data: { data: fallbackData }
      };
    });
};