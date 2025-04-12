// src/components/common/ApiDebugger.js
import React, { useState } from 'react';
import axios from 'axios';
import config from '../../config';

const ApiDebugger = () => {
  const [endpoint, setEndpoint] = useState('/auth/login');
  const [method, setMethod] = useState('POST');
  const [requestBody, setRequestBody] = useState(JSON.stringify({
    email: "test@example.com",
    password: "password123"
  }, null, 2));
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      let parsedBody;
      try {
        parsedBody = JSON.parse(requestBody);
      } catch (parseError) {
        setError(`JSON parse error: ${parseError.message}`);
        setLoading(false);
        return;
      }

      const fullUrl = `${config.apiUrl}${endpoint}`;
      console.log(`Sending ${method} request to ${fullUrl} with body:`, parsedBody);

      let result;
      switch (method) {
        case 'GET':
          result = await axios.get(fullUrl);
          break;
        case 'POST':
          result = await axios.post(fullUrl, parsedBody, {
            headers: { 'Content-Type': 'application/json' }
          });
          break;
        case 'PUT':
          result = await axios.put(fullUrl, parsedBody, {
            headers: { 'Content-Type': 'application/json' }
          });
          break;
        case 'DELETE':
          result = await axios.delete(fullUrl);
          break;
        default:
          result = await axios.post(fullUrl, parsedBody, {
            headers: { 'Content-Type': 'application/json' }
          });
      }

      setResponse({
        status: result.status,
        statusText: result.statusText,
        data: result.data,
        headers: result.headers
      });
    } catch (error) {
      console.error('API test error:', error);
      setError({
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : null,
        request: error.request ? 'Request sent but no response received' : null
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="api-debugger">
      <h2>API Debugger</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>API Endpoint</label>
          <div className="endpoint-input">
            <span className="base-url">{config.apiUrl}</span>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="form-control"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>Method</label>
          <select 
            value={method} 
            onChange={(e) => setMethod(e.target.value)}
            className="form-control"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Request Body (JSON)</label>
          <textarea
            value={requestBody}
            onChange={(e) => setRequestBody(e.target.value)}
            className="form-control"
            rows="6"
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Request'}
        </button>
      </form>
      
      {error && (
        <div className="api-response error">
          <h3>Error</h3>
          <div className="alert alert-danger">
            <p><strong>Message:</strong> {error.message}</p>
            {error.response && (
              <>
                <p><strong>Status:</strong> {error.response.status} {error.response.statusText}</p>
                <p><strong>Response Data:</strong></p>
                <pre>{JSON.stringify(error.response.data, null, 2)}</pre>
              </>
            )}
            {error.request && (
              <p><strong>Request:</strong> {error.request}</p>
            )}
          </div>
        </div>
      )}
      
      {response && (
        <div className="api-response success">
          <h3>Response</h3>
          <div className="response-info">
            <p><strong>Status:</strong> {response.status} {response.statusText}</p>
            <p><strong>Response Data:</strong></p>
            <pre>{JSON.stringify(response.data, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiDebugger;