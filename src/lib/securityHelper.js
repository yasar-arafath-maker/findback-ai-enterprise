/**
 * FindBack AI Security Helper
 * Handles input sanitization, rate limiting, and email/OTP validation.
 */

// Rate limiter store: key -> array of timestamps
const rateLimitStore = new Map();

/**
 * Check and record a rate-limited action.
 * @param {string} key - Unique identifier (e.g. `otp_resend:user@email.com`)
 * @param {number} maxAttempts - Maximum allowed attempts in window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} True if allowed, throws Error if rate limit exceeded.
 */
export const checkRateLimit = (key, maxAttempts = 3, windowMs = 5 * 60 * 1000) => {
  const now = Date.now();
  const timestamps = rateLimitStore.get(key) || [];
  
  // Filter out timestamps outside the current window
  const validTimestamps = timestamps.filter(ts => now - ts < windowMs);

  if (validTimestamps.length >= maxAttempts) {
    const oldest = validTimestamps[0];
    const retryAfterSec = Math.ceil((windowMs - (now - oldest)) / 1000);
    throw new Error(`Too many attempts. Please wait ${retryAfterSec} seconds before trying again.`);
  }

  validTimestamps.push(now);
  rateLimitStore.set(key, validTimestamps);
  return true;
};

/**
 * Sanitize email input
 * @param {string} email 
 * @returns {string} Cleaned email
 */
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') {
    throw new Error('Valid email address is required.');
  }
  const clean = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clean)) {
    throw new Error('Please enter a valid email address.');
  }
  return clean;
};

/**
 * Sanitize OTP code input
 * @param {string} code 
 * @returns {string} Cleaned 6-digit OTP code
 */
export const sanitizeOtpCode = (code) => {
  if (!code || typeof code !== 'string' && typeof code !== 'number') {
    throw new Error('6-digit verification code is required.');
  }
  const clean = String(code).trim().replace(/\D/g, '');
  if (clean.length !== 6) {
    throw new Error('Verification code must be exactly 6 digits.');
  }
  return clean;
};

/**
 * Sanitize general text inputs to prevent XSS / script injection
 * @param {string} str 
 * @returns {string}
 */
export const sanitizeInput = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};
