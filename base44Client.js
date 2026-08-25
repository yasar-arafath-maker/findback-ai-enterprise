/**
 * Single source of truth for the Base44 SDK client.
 *
 * In production (when __B44_DB__ is injected by the platform) this re-exports
 * the runtime-provided client.  During local development, a minimal fallback
 * is only activated when VITE_DEV_BYPASS_AUTH is explicitly set to "true";
 * otherwise the default stub rejects auth – forcing the real login flow.
 */

const DEV_BYPASS = typeof import.meta !== 'undefined'
  && import.meta.env?.VITE_DEV_BYPASS_AUTH === 'true';

const devBypassDb = {
  auth: {
    isAuthenticated: async () => true,
    me: async () => ({
      id: 'dev-user',
      email: 'dev@localhost',
      role: 'admin',
      account_status: 'active',
    }),
    register: async (data) => ({ status: 'success', email: data?.email }),
    loginViaEmailPassword: async (email) => ({
      access_token: 'dev_token',
      user: { id: 'dev-user', email },
    }),
    verifyOtp: async ({ email }) => ({
      access_token: 'dev_token',
      user: { id: 'dev-user', email },
    }),
    resendOtp: async () => ({ status: 'sent' }),
    setToken: (token) => { try { localStorage.setItem('b44_token', token); } catch {} },
    logout: (redirectUrl) => {
      try { localStorage.removeItem('b44_token'); } catch {}
      if (redirectUrl) window.location.href = redirectUrl;
    },
    redirectToLogin: (redirectUrl) => {
      window.location.href = '/login' + (redirectUrl ? '?returnTo=' + encodeURIComponent(redirectUrl) : '');
    },
    resetPasswordRequest: async () => ({ status: 'sent' }),
    resetPassword: async () => ({ status: 'reset' }),
  },
  entities: new Proxy({}, {
    get: () => ({
      filter: async () => [],
      get: async () => null,
      create: async (data) => ({ id: 'mock-id-' + Date.now(), ...data }),
      update: async (id, data) => ({ id, ...data }),
      delete: async () => ({}),
    }),
  }),
  integrations: {
    Core: { UploadFile: async () => ({ file_url: '' }) },
  },
};

const strictStub = {
  auth: {
    isAuthenticated: async () => false,
    me: async () => null,
    register: async () => { throw new Error('Auth not available – SDK not loaded'); },
    loginViaEmailPassword: async () => { throw new Error('Auth not available – SDK not loaded'); },
    verifyOtp: async () => { throw new Error('Auth not available – SDK not loaded'); },
    resendOtp: async () => { throw new Error('Auth not available – SDK not loaded'); },
    setToken: () => {},
    logout: (redirectUrl) => { if (redirectUrl) window.location.href = redirectUrl; },
    redirectToLogin: (redirectUrl) => {
      window.location.href = '/login' + (redirectUrl ? '?returnTo=' + encodeURIComponent(redirectUrl) : '');
    },
    resetPasswordRequest: async () => { throw new Error('Auth not available – SDK not loaded'); },
    resetPassword: async () => { throw new Error('Auth not available – SDK not loaded'); },
  },
  entities: new Proxy({}, {
    get: () => ({
      filter: async () => [],
      get: async () => null,
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => ({}),
    }),
  }),
  integrations: {
    Core: { UploadFile: async () => ({ file_url: '' }) },
  },
};

/**
 * Runtime client: prefer the platform-injected __B44_DB__, then dev-bypass
 * (if explicitly opted in), and finally a strict stub that rejects auth.
 */
export const db = globalThis.__B44_DB__ || (DEV_BYPASS ? devBypassDb : strictStub);
export const base44 = db;
export default db;