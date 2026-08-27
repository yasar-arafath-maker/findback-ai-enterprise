/**
 * FindBack AI — Resilient Network Client & API Router
 * Handles dynamic environment base URLs, offline state checks,
 * automatic token authorization headers, timeouts, and error handling.
 */

// Determine dynamic API Base URL
export const getApiBaseUrl = () => {
  const envUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_BASE_URL : null;
  if (envUrl) return envUrl;

  // If running in Capacitor Android Native environment
  if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform()) {
    // 10.0.2.2 is the Android Emulator alias for host computer's localhost
    return 'http://10.0.2.2:5000/api';
  }

  return 'http://localhost:5000/api';
};

/**
 * Fetch wrapper with global interceptor behavior
 * @param {string} endpoint - Relative API endpoint or full URL
 * @param {object} options - Fetch options
 */
export const resilientFetch = async (endpoint, options = {}) => {
  // 1. Check network connectivity
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('No internet connection. Please check your network and try again.');
  }

  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  // 2. Attach Auth Token if stored
  const token = typeof localStorage !== 'undefined' 
    ? (localStorage.getItem('b44_token') || localStorage.getItem('base44_access_token'))
    : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  // 3. Configure Timeout (default 15s)
  const timeoutMs = options.timeout || 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    // 4. Handle HTTP Error Statuses
    if (response.status === 401) {
      // Token expired or invalid session
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('b44_token');
        localStorage.removeItem('b44_user');
      }
      throw new Error('Session expired. Please log in again.');
    }

    if (response.status === 403) {
      throw new Error('Access denied. You do not have permission for this action.');
    }

    if (response.status >= 500) {
      throw new Error('Server error encountered. Please try again in a few moments.');
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Network request timed out. Please check your connection.');
    }
    throw error;
  }
};
