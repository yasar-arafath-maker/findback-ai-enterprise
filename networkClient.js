/**
 * FindBack AI — Resilient Network Client & API Router
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles dynamic environment base URLs (strictly using VITE_API_BASE_URL in production),
 * offline state checks, token authorization headers, Render cold-start retry logic,
 * and robust Server-Sent Events (SSE) auto-reconnection management.
 */

// Determine dynamic API Base URL
export const getApiBaseUrl = () => {
  const envUrl = typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_BACKEND_URL) : null;
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  // If running in Capacitor Android Native environment
  if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform()) {
    return 'http://10.0.2.2:5000/api';
  }

  // Custom local storage IP if specified by developer
  if (typeof localStorage !== 'undefined') {
    const customIp = localStorage.getItem('zexo_backend_ip') || localStorage.getItem('SERVER_IP');
    if (customIp) return customIp.startsWith('http') ? `${customIp.replace(/\/+$/, '')}/api` : `http://${customIp}:5000/api`;
  }

  // Production-ready Render backend fallback
  return 'https://findback-ai-backend.onrender.com/api';
};

/**
 * Fetch wrapper with global interceptor, auto-retry for Render cold-starts, and timeout handling
 * @param {string} endpoint - Relative API endpoint (e.g. '/entities/LostReports') or full URL
 * @param {object} options - Fetch options
 * @param {number} [maxRetries=2] - Retry attempts on cold start (500/502/503/504)
 */
export const resilientFetch = async (endpoint, options = {}, maxRetries = 2) => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('No internet connection. Please check your network and try again.');
  }

  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const token = typeof localStorage !== 'undefined'
    ? (localStorage.getItem('b44_token') || localStorage.getItem('base44_access_token'))
    : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const timeoutMs = options.timeout || 20000; // 20s timeout for cold-starting instances

  let lastError = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      // 401 Unauthorized
      if (response.status === 401) {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('b44_token');
          localStorage.removeItem('b44_user');
        }
        throw new Error('Session expired. Please log in again.');
      }

      // 403 Forbidden
      if (response.status === 403) {
        throw new Error('Access denied. You do not have permission for this action.');
      }

      // Cloud instance warming up / 502/503/504 Bad Gateway / Service Unavailable
      if ([500, 502, 503, 504].includes(response.status) && attempt < maxRetries) {
        console.warn(`[NetworkClient] Cloud backend cold-starting (${response.status}). Retrying attempt ${attempt + 1}/${maxRetries}...`);
        await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }

      if (response.status >= 500) {
        throw new Error('Server error: Cloud backend is initializing or encountered an issue. Please retry in a few seconds.');
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;

      if (error.name === 'AbortError' && attempt < maxRetries) {
        console.warn(`[NetworkClient] Request timeout on attempt ${attempt + 1}. Retrying for cloud cold-start...`);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      if (attempt === maxRetries) {
        if (error.name === 'AbortError') {
          throw new Error('Connection timed out. The cloud server may be spinning up; please retry shortly.');
        }
        throw error;
      }
    }
  }

  throw lastError || new Error('Network request failed');
};

/**
 * Robust Server-Sent Events (SSE) Live Connection Manager with Auto-Reconnect
 * @param {Function} onMessage - Callback for incoming SSE event payload
 * @param {Function} [onError] - Callback on connection error
 * @returns {Function} cleanup function to close EventSource
 */
export const createLiveEventStream = (onMessage, onError = null) => {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return () => {};
  }

  let eventSource = null;
  let retryCount = 0;
  let isClosedManually = false;

  const connect = () => {
    if (isClosedManually) return;

    const baseUrl = getApiBaseUrl();
    const sseUrl = baseUrl.endsWith('/api')
      ? `${baseUrl.slice(0, -4)}/api/events`
      : `${baseUrl}/api/events`;

    try {
      eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        retryCount = 0;
        if (process.env.NODE_ENV !== 'production') {
          console.log('[SSE] Live stream connected to:', sseUrl);
        }
      };

      eventSource.onmessage = (e) => {
        try {
          if (e.data === ': ping' || !e.data) return; // Keep-alive ping
          const data = JSON.parse(e.data);
          if (onMessage) onMessage(data);
        } catch (err) {
          // ignore non-json messages
        }
      };

      eventSource.onerror = (err) => {
        if (eventSource) eventSource.close();
        if (onError) onError(err);

        if (!isClosedManually) {
          retryCount++;
          const delay = Math.min(1000 * Math.pow(1.5, retryCount), 15000);
          console.log(`[SSE] Disconnected. Reconnecting in ${Math.round(delay / 1000)}s...`);
          setTimeout(connect, delay);
        }
      };
    } catch (err) {
      if (onError) onError(err);
    }
  };

  connect();

  return () => {
    isClosedManually = true;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
};

export default resilientFetch;
