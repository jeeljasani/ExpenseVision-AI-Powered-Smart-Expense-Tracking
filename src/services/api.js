// src/services/api.js
import axios from 'axios';
import config from '../config';

const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add debugging interceptors
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data ? 'Data present' : 'No data' // Simplified to avoid logging file data
    });
    
    // Check for malformed data
    if (config.data === undefined) {
      console.error('Warning: Trying to send undefined data!');
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('API Response Status:', response.status);
    
    // Try to parse response.data if it's a string (could be a JSON string)
    if (typeof response.data === 'string' && response.data.trim().startsWith('{')) {
      try {
        const parsedData = JSON.parse(response.data);
        console.log('Parsed JSON response data:', parsedData);
        response.data = parsedData;
      } catch (error) {
        console.warn('Response looks like JSON but failed to parse:', error);
      }
    }
    
    console.log('API Response Data Type:', typeof response.data);
    console.log('API Response Data Keys:', Object.keys(response.data || {}));
    
    // Validate that the response contains actual data
    if (response.data === undefined || response.data === null) {
      console.error('Warning: Received empty response data');
    }
    
    return response;
  },
  (error) => {
    // Log the full error for debugging
    console.error('API Response Error:', error.response || error);
    
    // If there's a JSON parsing error, handle it specially
    if (error.message && error.message.includes('JSON')) {
      console.error('JSON parsing error. Response data:', error.response?.data);
      // Check the raw response if available
      if (error.request && error.request.responseText) {
        console.error('Raw response text:', error.request.responseText);
        
        // Try to manually parse the response
        try {
          const parsedData = JSON.parse(error.request.responseText);
          if (error.response) {
            error.response.data = parsedData;
          }
        } catch (parseError) {
          console.error('Failed to manually parse response:', parseError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Add a request interceptor to include the token in requests
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Make sure userId is set in localStorage for API requests
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          if (userData.id) {
            localStorage.setItem('userId', userData.id);
            console.log('Using userId for request:', userData.id);
          }
        } catch (parseError) {
          console.error('Error parsing user data from localStorage:', parseError);
        }
      }
      
      // For testing - fallback to hardcoded userId if not found
      if (!localStorage.getItem('userId')) {
        localStorage.setItem('userId', 'b59d054f-ce81-4de9-a142-be2283ddaef6');
        console.log('Using fallback userId for request');
      }
    } catch (err) {
      console.error('Error accessing token in localStorage:', err);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper function to safely handle API responses
function handleResponse(response) {
  // Handle string data by parsing it as JSON if needed
  if (typeof response.data === 'string') {
    try {
      response.data = JSON.parse(response.data);
    } catch (e) {
      console.error('Failed to parse string response data as JSON:', e);
    }
  }
  
  // Make sure we have data before returning
  if (!response || !response.data) {
    console.error('Empty response or missing data field');
    throw new Error('Invalid response from server');
  }
  
  // Check response format based on your API expectations
  if (response.data.message === 'Missing Authentication Token') {
    console.error('Authentication error from API Gateway');
    throw new Error('Authentication error. Check API Gateway configuration.');
  }
  
  return response;
}

export const authService = {
  register: (userData) => {
    console.log('Registering with data:', userData);
    // Ensure we're sending exactly what the API expects
    return api.post('/auth/register', {
      email: userData.email,
      password: userData.password,
      name: userData.name
    }).then((response) => {
      // Store user ID if present in response
      if (response.data.user && response.data.user.id) {
        localStorage.setItem('userId', response.data.user.id);
        console.log('Stored userId after registration:', response.data.user.id);
      }
      return handleResponse(response);
    });
  },
  login: (credentials) => {
    console.log('Logging in with credentials:', credentials);
    return api.post('/auth/login', {
      email: credentials.email,
      password: credentials.password
    }).then((response) => {
      // Store user ID if present in response
      if (response.data.user && response.data.user.id) {
        localStorage.setItem('userId', response.data.user.id);
        console.log('Stored userId after login:', response.data.user.id);
      }
      return handleResponse(response);
    });
  },
  logout: () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      console.log('Cleared auth data from localStorage');
    } catch (err) {
      console.error('Error clearing localStorage:', err);
    }
  },
  
  // Helper to set test user ID for development
  setTestUserId: () => {
    localStorage.setItem('userId', 'b59d054f-ce81-4de9-a142-be2283ddaef6');
    console.log('Set test userId in localStorage');
    return 'Test user ID set';
  }
};

export default api;