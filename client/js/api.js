// Replace with your live Render backend URL in production
const BACKEND_URL = 'https://aether-api.onrender.com'; 

const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '/api'
  : `${BACKEND_URL}/api`;

/**
 * Custom fetch wrapper for interacting with REST API backend.
 * Automatically configures credentials for httpOnly JWT cookie authentication.
 * @param {string} endpoint - API endpoint (e.g. '/auth/login', '/products')
 * @param {object} options - Fetch options overrides (method, headers, body, etc.)
 */
export async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  // Set default options
  const defaultHeaders = {};
  if (options.body && !(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const fetchOptions = {
    method: options.method || 'GET',
    headers: {
      ...defaultHeaders,
      ...options.headers
    },
    credentials: 'include', // Crucial for httpOnly cookies
    ...options
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, fetchOptions);
    const result = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      // Return structured error message from API if available
      const errMsg = result.error?.message || response.statusText || 'An error occurred';
      const error = new Error(errMsg);
      error.status = response.status;
      error.details = result.error;
      throw error;
    }
    
    return result;
  } catch (error) {
    console.error(`API Call failed on ${endpoint}:`, error.message);
    throw error;
  }
}
