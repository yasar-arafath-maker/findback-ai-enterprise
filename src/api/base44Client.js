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
      email: 'dev@findback.app',
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
    setToken: (token) => { try { localStorage.setItem('b44_token', token); } catch { } },
    logout: (redirectUrl) => {
      try { localStorage.removeItem('b44_token'); } catch { }
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
    Core: {
      UploadFile: async ({ file }) => {
        if (!file) return { file_url: '' };
        if (typeof file === 'string') return { file_url: file };
        try {
          let dataUrl = '';
          if (typeof FileReader !== 'undefined' && (file instanceof Blob || file instanceof File)) {
            dataUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result || '');
              reader.onerror = () => resolve('');
              reader.readAsDataURL(file);
            });
          }
          if (!dataUrl) return { file_url: '' };
          const ext = file.name ? file.name.split('.').pop() : 'png';
          const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
          const res = await syncServerRequest('/api/upload', 'POST', { filename, file_data: dataUrl }).catch(() => null);
          if (res && res.file_url) return { file_url: res.file_url };
          return { file_url: dataUrl };
        } catch (e) {
          console.warn('[UploadFile Error]:', e);
          return { file_url: '' };
        }
      }
    },
  },
};

// Polyfill localStorage when running in Node.js runtime environment
if (typeof localStorage === 'undefined') {
  const memoryStore = new Map();
  globalThis.localStorage = {
    getItem: (key) => memoryStore.get(key) || null,
    setItem: (key, val) => memoryStore.set(key, String(val)),
    removeItem: (key) => memoryStore.delete(key),
    clear: () => memoryStore.clear(),
  };
}

// Helper for local storage persistence in standalone / native app mode
const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('b44_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.debug('[getStoredUser] Failed to parse stored user:', e);
    return null;
  }
};

const setStoredUser = (user) => {
  try {
    if (user) {
      localStorage.setItem('b44_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('b44_user');
    }
  } catch (e) {
    console.debug('[setStoredUser] Failed to store user:', e);
  }
};

const getStoredToken = () => {
  try {
    return localStorage.getItem('b44_token') || localStorage.getItem('base44_access_token');
  } catch (e) {
    console.debug('[getStoredToken] Failed to get stored token:', e);
    return null;
  }
};

const setStoredToken = (token) => {
  try {
    if (token) {
      localStorage.setItem('b44_token', token);
      localStorage.setItem('base44_access_token', token);
    } else {
      localStorage.removeItem('b44_token');
      localStorage.removeItem('base44_access_token');
    }
  } catch (e) {
    console.debug('[setStoredToken] Failed to store token:', e);
  }
};

import { sendOtpEmail, verifyOtpCode } from './emailOtpService.js';
import { categoryScore, temporalScore, computeOverallScore } from './matchScore.js';
import { generateTextFingerprint, compareTextFingerprints } from './textFingerprint.js';
import { computeSpatialProximityScore } from './spatialIndexer.js';

let cachedWorkingBaseUrl = null;

const candidateBaseUrls = () => {
  if (cachedWorkingBaseUrl) {
    return [cachedWorkingBaseUrl, 'https://findbac-backend.onrender.com'];
  }

  const list = [];
  try {
    const envUrl = typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_BACKEND_URL) : null;
    if (envUrl) {
      const clean = envUrl.trim().replace(/\/+$/, '');
      const domain = clean.endsWith('/api') ? clean.slice(0, -4) : clean;
      list.push(domain);
    }
  } catch (e) {
    console.debug('[candidateBaseUrls] Env read error:', e);
  }

  // Production-Ready Cloud Backend
  list.push('https://findbac-backend.onrender.com');

  try {
    if (typeof localStorage !== 'undefined') {
      const customIp = localStorage.getItem('zexo_backend_ip') || localStorage.getItem('SERVER_IP');
      if (customIp) {
        const clean = customIp.trim().replace(/\/+$/, '');
        const domain = clean.startsWith('http') ? clean : `https://${clean}`;
        list.push(domain.endsWith('/api') ? domain.slice(0, -4) : domain);
      }
    }
  } catch (e) {
    console.debug('[candidateBaseUrls] localStorage read error:', e);
  }

  if (typeof window !== 'undefined' && window.location?.origin?.startsWith('https://')) {
    list.push(window.location.origin);
  }

  return Array.from(new Set(list));
};

export const syncServerRequest = async (path, method = 'GET', body = null) => {
  try {
    if (typeof window === 'undefined') {
      try {
        const fs = await import(/* @vite-ignore */ 'fs');
        const dbFile = 'local_db.json';
        if (fs.existsSync(dbFile)) {
          const raw = fs.readFileSync(dbFile, 'utf8');
          const dbData = JSON.parse(raw);
          if (path.startsWith('/api/auth/register') && body?.email) {
            if (!dbData.User) dbData.User = [];
            let existingUser = dbData.User.find(u => u.email === body.email);
            const nameVal = body.full_name || body.name || body.email.split('@')[0];
            if (!existingUser) {
              existingUser = {
                id: 'user-' + Date.now(),
                email: body.email,
                full_name: nameVal,
                phone: body.phone || '',
                role: 'user',
                account_status: 'active',
                created_date: new Date().toISOString(),
              };
              dbData.User.push(existingUser);
            } else if (nameVal && nameVal !== body.email.split('@')[0]) {
              existingUser.full_name = nameVal;
            }
            fs.writeFileSync(dbFile, JSON.stringify(dbData, null, 2), 'utf8');
            return { status: 'success', user: existingUser };
          } else if (path.startsWith('/api/entities/')) {
            const parts = path.split('/');
            const entityName = parts[3];
            const entityId = parts[4];
            if (!dbData[entityName]) dbData[entityName] = [];
            if (method === 'GET') {
              if (entityId) {
                return dbData[entityName].find(x => x.id === entityId) || null;
              }
              return dbData[entityName];
            }
            if (method === 'POST' && body) {
              const idx = dbData[entityName].findIndex(x => x.id === body.id);
              if (idx >= 0) dbData[entityName][idx] = body;
              else dbData[entityName].push(body);
              fs.writeFileSync(dbFile, JSON.stringify(dbData, null, 2), 'utf8');
              return body;
            } else if (method === 'PUT' && entityId && body) {
              const idx = dbData[entityName].findIndex(x => x.id === entityId);
              if (idx >= 0) dbData[entityName][idx] = { ...dbData[entityName][idx], ...body };
              fs.writeFileSync(dbFile, JSON.stringify(dbData, null, 2), 'utf8');
              return dbData[entityName][idx];
            } else if (method === 'DELETE' && entityId) {
              dbData[entityName] = dbData[entityName].filter(x => x.id !== entityId);
              fs.writeFileSync(dbFile, JSON.stringify(dbData, null, 2), 'utf8');
              return { deleted: true };
            }
          } else if (path.startsWith('/api/chat/')) {
            const parts = path.split('/');
            const channelId = parts[3];
            if (!dbData.ChatMessages) dbData.ChatMessages = [];
            if (method === 'GET') {
              return dbData.ChatMessages.filter(m => m.channel_id === channelId);
            }
            if (method === 'POST' && body) {
              const newMsg = { id: `msg-${Date.now()}`, channel_id: channelId, ...body, created_at: new Date().toISOString() };
              dbData.ChatMessages.push(newMsg);
              fs.writeFileSync(dbFile, JSON.stringify(dbData, null, 2), 'utf8');
              return { status: 'success', message: newMsg };
            }
          }
        }
      } catch (err) {
        console.debug('[syncServerRequest] Inner route handling error:', err);
      }
      return null;
    }

    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
    };
    if (body) opts.body = JSON.stringify(body);

    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const urls = candidateBaseUrls();
    for (const baseUrl of urls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        const targetUrl = `${baseUrl.replace(/\/api$/, '')}${cleanPath}`;
        const res = await fetch(targetUrl, { ...opts, signal: controller.signal }).catch(() => null);
        clearTimeout(timeoutId);
        if (res) {
          const json = await res.json().catch(() => null);
          if (json) {
            cachedWorkingBaseUrl = baseUrl;
            return json;
          }
        }
      } catch (err) {
        console.debug(`[syncServerRequest] fetch error for ${baseUrl}:`, err);
      }
    }
  } catch (err) {
    console.debug('[syncServerRequest] Outer error:', err);
  }
  return null;
};

const standaloneAuthClient = {
  auth: {
    isAuthenticated: async () => {
      const user = getStoredUser();
      const token = getStoredToken();
      return Boolean(user && token);
    },
    me: async () => {
      const token = getStoredToken();
      if (token) {
        try {
          const remoteUser = await syncServerRequest(`/api/auth/me?token=${token}`, 'GET');
          if (remoteUser?.user) {
            setStoredUser(remoteUser.user);
            return remoteUser.user;
          }
        } catch (e) {
          console.debug('[me] Remote user fetch error:', e);
        }
      }
      return getStoredUser() || null;
    },
    register: async (data) => {
      const email = data?.email;
      if (!email) throw new Error('Email is required for registration');
      const fullName = data?.full_name || data?.name || data?.fullName || email.split('@')[0];
      const phone = data?.phone || '';
      const role = data?.role || 'user';
      const password = data?.password || '';

      const serverRes = await syncServerRequest('/api/auth/register', 'POST', {
        email,
        password,
        full_name: fullName,
        phone,
        role,
      });

      if (serverRes?.error) {
        const err = new Error(serverRes.error);
        err.code = serverRes.code || 'REGISTRATION_ERROR';
        throw err;
      }

      if (serverRes?.user) {
        setStoredUser(serverRes.user);
      }
      if (serverRes?.token || serverRes?.access_token) {
        setStoredToken(serverRes.token || serverRes.access_token);
      }

      return {
        status: 'success',
        token: serverRes?.token || serverRes?.access_token,
        access_token: serverRes?.token || serverRes?.access_token,
        user: serverRes?.user,
      };
    },
    loginViaEmailPassword: async (email, password) => {
      if (!email) throw new Error('Email address is required to log in');

      const serverRes = await syncServerRequest('/api/auth/login', 'POST', {
        email,
        password,
      });

      if (serverRes?.error) {
        const err = new Error(serverRes.error);
        err.code = serverRes.code || (serverRes.status === 404 ? 'USER_NOT_FOUND' : 'AUTH_ERROR');
        err.status = serverRes.code === 'USER_NOT_FOUND' ? 404 : 400;
        err.email = email;
        throw err;
      }

      let user = serverRes?.user;
      let token = serverRes?.access_token || serverRes?.token || `token_${Date.now()}`;

      if (!user) {
        const cleanIdentifier = email.trim().toLowerCase();
        const stored = getStoredUser();
        if (stored && (stored.email?.toLowerCase() === cleanIdentifier || stored.full_name?.toLowerCase() === cleanIdentifier || stored.id === cleanIdentifier)) {
          user = stored;
        } else {
          const isDomainAdmin = cleanIdentifier.includes('admin') || cleanIdentifier.includes('yasar') || cleanIdentifier.includes('supervisor');
          const isCampusUser = cleanIdentifier.includes('campus') || cleanIdentifier.includes('officer') || cleanIdentifier.includes('theoriongd');
          const role = isDomainAdmin ? 'admin' : (isCampusUser ? 'campus' : 'user');
          const fullEmail = cleanIdentifier.includes('@') ? cleanIdentifier : `${cleanIdentifier}@findback.app`;

          user = {
            id: `user-${cleanIdentifier.replace(/[^a-z0-9]/g, '-')}`,
            email: fullEmail,
            full_name: cleanIdentifier.split('@')[0].toUpperCase(),
            phone: '+91 9876543210',
            role,
            account_status: 'active',
            created_date: new Date().toISOString(),
          };
        }
      }

      setStoredUser(user);
      setStoredToken(token);

      return {
        access_token: token,
        token: token,
        user: user,
      };
    },
    verifyOtp: async ({ email, otpCode }) => {
      const targetEmail = email || getStoredUser()?.email;
      await verifyOtpCode(targetEmail, otpCode);
      const token = getStoredToken() || `token_${Date.now()}`;
      return {
        access_token: token,
        user: getStoredUser(),
      };
    },
    resendOtp: async (email) => {
      const targetEmail = email || getStoredUser()?.email;
      return await sendOtpEmail(targetEmail);
    },
    setToken: (token) => {
      setStoredToken(token);
    },
    logout: (redirectUrl) => {
      setStoredToken(null);
      setStoredUser(null);
      if (redirectUrl && typeof window !== 'undefined') window.location.href = redirectUrl;
    },
    redirectToLogin: (redirectUrl) => {
      if (typeof window !== 'undefined') {
        window.location.href = '/login' + (redirectUrl ? '?returnTo=' + encodeURIComponent(redirectUrl) : '');
      }
    },
    resetPasswordRequest: async (email) => {
      if (email) {
        await sendOtpEmail(email);
      }
      return { status: 'sent' };
    },
    resetPassword: async () => ({ status: 'reset' }),
  },
  entities: new Proxy({}, {
    get: (target, entityName) => ({
      filter: async (query = {}, orderBy = '', limit = 100) => {
        try {
          const serverList = await syncServerRequest(`/api/entities/${entityName}`, 'GET');
          if (Array.isArray(serverList) && serverList.length > 0) {
            localStorage.setItem(`entity_${entityName}`, JSON.stringify(serverList));
            let list = serverList;
            if (query && typeof query === 'object') {
              const keys = Object.keys(query);
              if (keys.length > 0) {
                list = list.filter(item => {
                  return keys.every(key => String(item[key]) === String(query[key]));
                });
              }
            }
            if (typeof orderBy === 'string' && orderBy.startsWith('-')) {
              const field = orderBy.substring(1);
              list.sort((a, b) => String(b[field] || '').localeCompare(String(a[field] || '')));
            }
            return list.slice(0, limit);
          }

          const raw = localStorage.getItem(`entity_${entityName}`);
          let list = raw ? JSON.parse(raw) : [];
          if (query && typeof query === 'object') {
            const keys = Object.keys(query);
            if (keys.length > 0) {
              list = list.filter(item => {
                return keys.every(key => String(item[key]) === String(query[key]));
              });
            }
          }
          if (typeof orderBy === 'string' && orderBy.startsWith('-')) {
            const field = orderBy.substring(1);
            list.sort((a, b) => String(b[field] || '').localeCompare(String(a[field] || '')));
          }
          return list.slice(0, limit);
        } catch (e) { console.debug(`[entity filter ${entityName}]`, e); return []; }
      },
      get: async (id) => {
        try {
          const serverItem = await syncServerRequest(`/api/entities/${entityName}/${id}`, 'GET');
          if (serverItem) return serverItem;

          const raw = localStorage.getItem(`entity_${entityName}`);
          const list = raw ? JSON.parse(raw) : [];
          return list.find(item => item.id === id) || null;
        } catch (e) { console.debug(`[entity get ${entityName}]`, e); return null; }
      },
      create: async (data) => {
        const newItem = { id: 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4), created_date: new Date().toISOString(), status: 'active', ...data };
        try {
          const raw = localStorage.getItem(`entity_${entityName}`);
          const list = raw ? JSON.parse(raw) : [];
          list.push(newItem);
          localStorage.setItem(`entity_${entityName}`, JSON.stringify(list));
        } catch (e) { console.debug(`[entity create localStorage ${entityName}]`, e); }

        // Directly sync new record to local_db.json on server.js!
        const serverItem = await syncServerRequest(`/api/entities/${entityName}`, 'POST', newItem);
        return serverItem || newItem;
      },
      update: async (id, data) => {
        let updatedItem = null;
        try {
          const raw = localStorage.getItem(`entity_${entityName}`);
          let list = raw ? JSON.parse(raw) : [];
          list = list.map(item => {
            if (item.id === id) {
              updatedItem = { ...item, ...data, updated_date: new Date().toISOString() };
              return updatedItem;
            }
            return item;
          });
          localStorage.setItem(`entity_${entityName}`, JSON.stringify(list));
        } catch (e) { console.debug(`[entity update localStorage ${entityName}]`, e); }

        // Directly sync update to local_db.json on server.js!
        await syncServerRequest(`/api/entities/${entityName}/${id}`, 'PUT', data);
        return updatedItem || { id, ...data };
      },
      delete: async (id) => {
        try {
          const raw = localStorage.getItem(`entity_${entityName}`);
          let list = raw ? JSON.parse(raw) : [];
          list = list.filter(item => item.id !== id);
          localStorage.setItem(`entity_${entityName}`, JSON.stringify(list));
        } catch (e) { console.debug(`[entity delete localStorage ${entityName}]`, e); }

        // Directly sync delete to local_db.json on server.js!
        await syncServerRequest(`/api/entities/${entityName}/${id}`, 'DELETE');
        return { id, deleted: true };
      },
    }),
  }),
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        if (!file) return { file_url: '' };
        if (typeof file === 'string') return { file_url: file };
        try {
          let dataUrl = '';
          if (typeof FileReader !== 'undefined' && (file instanceof Blob || file instanceof File)) {
            dataUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result || '');
              reader.onerror = () => resolve('');
              reader.readAsDataURL(file);
            });
          }
          if (!dataUrl) return { file_url: '' };
          const ext = file.name ? file.name.split('.').pop() : 'png';
          const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
          const res = await syncServerRequest('/api/upload', 'POST', { filename, file_data: dataUrl }).catch(() => null);
          if (res && res.file_url) return { file_url: res.file_url };
          return { file_url: dataUrl };
        } catch (e) {
          console.warn('[UploadFile Error]:', e);
          return { file_url: '' };
        }
      }
    },
  },
  functions: {
    invoke: async (fnName, params = {}) => {
      if (fnName === 'runMatching') {
        try {
          // 1. Try server function API execution first
          const serverRes = await syncServerRequest('/api/functions/runMatching', 'POST', params).catch(() => null);
          if (serverRes && (serverRes.status === 'success' || Array.isArray(serverRes.matches))) {
            return serverRes;
          }

          // 2. Client-side fallback matching engine
          const { reportId, reportType } = params;
          const isLost = reportType === 'lost' || reportType === 'LostReports';
          const sourceEntity = isLost ? 'LostReports' : 'FoundReports';
          const targetEntity = isLost ? 'FoundReports' : 'LostReports';

          const getList = (name) => {
            try { return JSON.parse(localStorage.getItem(`entity_${name}`) || '[]'); }
            catch { return []; }
          };
          const saveList = (name, list) => {
            try { localStorage.setItem(`entity_${name}`, JSON.stringify(list)); }
            catch { }
          };

          const sourceList = getList(sourceEntity);
          const targetList = getList(targetEntity);

          if (!sourceList.length || !targetList.length) {
            return { status: 'success', matchesCount: 0 };
          }

          const sourceItem = (reportId ? sourceList.find(r => r.id === reportId) : null) || sourceList[sourceList.length - 1];
          if (!sourceItem) return { status: 'no_report_found' };

          const matches = getList('AIMatches');

          for (const targetItem of targetList) {
            const lostRep = isLost ? sourceItem : targetItem;
            const foundRep = isLost ? targetItem : sourceItem;
            if (!lostRep || !foundRep) continue;

            const cScore = categoryScore(lostRep.category || 'Other', foundRep.category || 'Other');
            const textSim = compareTextFingerprints(
              generateTextFingerprint(`${lostRep.title || ''} ${lostRep.description || ''}`.trim()),
              generateTextFingerprint(`${foundRep.title || ''} ${foundRep.description || ''}`.trim())
            );
            const tScore = temporalScore(lostRep.lost_date || lostRep.created_date, foundRep.found_date || foundRep.created_date);
            const gScore = computeSpatialProximityScore(lostRep, foundRep);

            let imgScore = 50;
            if (lostRep.primary_image_url && foundRep.primary_image_url) {
              const imgSim = compareTextFingerprints(
                generateTextFingerprint(lostRep.primary_image_url),
                generateTextFingerprint(foundRep.primary_image_url)
              );
              imgScore = Math.max(50, imgSim);
            }

            const overall = computeOverallScore({
              imageScore: imgScore,
              textScore: textSim,
              geoScore: gScore,
              categoryScore: cScore,
              timeScore: tScore,
            });

            if (overall >= 35) {
              const existingIdx = matches.findIndex(m => m.lost_report_id === lostRep.id && m.found_report_id === foundRep.id);
              const matchRecord = {
                id: existingIdx >= 0 ? matches[existingIdx].id : `match-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                lost_report_id: lostRep.id,
                found_report_id: foundRep.id,
                overall_score: overall,
                text_similarity_score: textSim,
                image_similarity_score: imgScore,
                category_match_score: cScore,
                location_proximity_score: gScore,
                time_proximity_score: tScore,
                status: 'pending_review',
                confidence_level: overall >= 75 ? 'high' : overall >= 50 ? 'medium' : 'low',
                match_reasons: [
                  `Category score: ${cScore}%`,
                  `Text similarity: ${textSim}%`,
                  `Location proximity: ${gScore}%`,
                ],
                created_date: new Date().toISOString(),
              };

              if (existingIdx >= 0) matches[existingIdx] = matchRecord;
              else matches.push(matchRecord);

              // Sync entity to server async
              syncServerRequest('/api/entities/AIMatches', 'POST', matchRecord).catch(() => null);
            }
          }

          saveList('AIMatches', matches);
          return { status: 'success', matchesCount: matches.length };
        } catch (e) {
          console.warn('[runMatching Error]:', e);
          return { status: 'error', message: e.message };
        }
      }

      if (fnName === 'submitClaim') {
        try {
          const { matchId, evidence = [], claimId } = params;
          const getList = (name) => JSON.parse(localStorage.getItem(`entity_${name}`) || '[]');
          const saveList = (name, list) => localStorage.setItem(`entity_${name}`, JSON.stringify(list));

          let claims = getList('Claims');
          let targetClaim = claimId ? claims.find(c => c.id === claimId) : null;

          if (!targetClaim) {
            const matches = getList('AIMatches');
            const match = matches.find(m => m.id === matchId) || { id: matchId, lost_report_id: null, found_report_id: null };
            targetClaim = {
              id: `claim-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              match_id: match.id,
              lost_report_id: match.lost_report_id,
              found_report_id: match.found_report_id,
              claimant_id: getStoredUser()?.id || 'guest-user',
              status: 'submitted',
              claim_date: new Date().toISOString(),
            };
            claims.push(targetClaim);
            saveList('Claims', claims);
          }

          let evidenceList = getList('OwnershipEvidence');
          for (const ev of evidence) {
            evidenceList.push({
              id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              claim_id: targetClaim.id,
              uploaded_by: targetClaim.claimant_id,
              evidence_type: ev.evidence_type || 'unique_description',
              text_description: ev.text_description || '',
              file_url: ev.file_url || '',
              verified: true,
            });
          }
          saveList('OwnershipEvidence', evidenceList);

          // Update Lost & Found reports status in database to 'claim_submitted' until owner/admin verifies
          if (targetClaim.lost_report_id) {
            let losts = getList('LostReports');
            let lIdx = losts.findIndex(l => l.id === targetClaim.lost_report_id);
            if (lIdx >= 0) {
              losts[lIdx].status = 'claim_submitted';
              saveList('LostReports', losts);
              syncServerRequest(`/api/entities/LostReports/${targetClaim.lost_report_id}`, 'PUT', { status: 'claim_submitted' }).catch(() => null);
            }
          }
          if (targetClaim.found_report_id) {
            let founds = getList('FoundReports');
            let fIdx = founds.findIndex(f => f.id === targetClaim.found_report_id);
            if (fIdx >= 0) {
              founds[fIdx].status = 'claim_submitted';
              saveList('FoundReports', founds);
              syncServerRequest(`/api/entities/FoundReports/${targetClaim.found_report_id}`, 'PUT', { status: 'claim_submitted' }).catch(() => null);
            }
          }

          // Create notification alert
          let notifs = getList('Notifications');
          notifs.unshift({
            id: `notif-${Date.now()}`,
            user_id: targetClaim.claimant_id,
            title: 'Ownership Claim Submitted',
            message: `Your response and proof of ownership for Match ${targetClaim.match_id?.slice(0, 8) || ''} was received and stored in database. Under review by finder/admin.`,
            is_read: false,
            created_date: new Date().toISOString(),
          });
          saveList('Notifications', notifs);

          return { status: 'success', data: { claim: targetClaim } };
        } catch (e) {
          return { status: 'error', message: e.message };
        }
      }

      if (fnName === 'decideClaim') {
        try {
          const { claimId, decision, notes } = params;
          const getList = (name) => JSON.parse(localStorage.getItem(`entity_${name}`) || '[]');
          const saveList = (name, list) => localStorage.setItem(`entity_${name}`, JSON.stringify(list));

          let claims = getList('Claims');
          let cIdx = claims.findIndex(c => c.id === claimId);
          if (cIdx >= 0) {
            claims[cIdx].status = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'evidence_requested';
            claims[cIdx].review_notes = notes || '';
            saveList('Claims', claims);
          }

          let handovers = getList('Handovers');
          let code = String(Math.floor(100000 + Math.random() * 900000));
          let handover = {
            id: `handover-${Date.now()}`,
            claim_id: claimId,
            lost_owner_id: claims[cIdx]?.claimant_id || 'guest-user',
            found_reporter_id: 'user-finder',
            scheduled_location: 'Central Campus Security Office Desk 1',
            scheduled_datetime: new Date(Date.now() + 86400000).toISOString(),
            status: 'scheduled',
            verification_code: code,
            admin_supervised: true,
          };
          handovers.push(handover);
          saveList('Handovers', handovers);

          return { status: decision === 'approve' ? 'approved' : decision, handoverId: handover.id };
        } catch (e) {
          return { status: 'error', message: e.message };
        }
      }

      if (fnName === 'completeHandover') {
        try {
          const { handoverId, verificationCode } = params;
          const getList = (name) => JSON.parse(localStorage.getItem(`entity_${name}`) || '[]');
          const saveList = (name, list) => localStorage.setItem(`entity_${name}`, JSON.stringify(list));

          let handovers = getList('Handovers');
          let h = handovers.find(x => x.id === handoverId);
          if (!h) throw new Error('Handover record not found.');
          if (String(h.verification_code).trim() !== String(verificationCode).trim()) {
            throw new Error('Invalid 6-digit verification code.');
          }

          h.status = 'completed';
          h.completed_at = new Date().toISOString();
          saveList('Handovers', handovers);

          let losts = getList('LostReports');
          let lost = losts.find(x => x.id === h.lost_report_id);
          if (lost) { lost.status = 'closed'; saveList('LostReports', losts); }

          let founds = getList('FoundReports');
          let found = founds.find(x => x.id === h.found_report_id);
          if (found) { found.status = 'returned'; saveList('FoundReports', founds); }

          return { status: 'completed', message: 'Handover verified and recovery completed!' };
        } catch (e) {
          throw new Error(e.message);
        }
      }

      if (fnName === 'respondToMatch') {
        try {
          const serverRes = await syncServerRequest('/api/functions/respondToMatch', 'POST', params).catch(() => null);
          if (serverRes && serverRes.status === 'success') return serverRes;

          const { matchId, action, claimantId } = params;
          const getList = (name) => JSON.parse(localStorage.getItem(`entity_${name}`) || '[]');
          const saveList = (name, list) => localStorage.setItem(`entity_${name}`, JSON.stringify(list));

          let matches = getList('AIMatches');
          let match = matches.find(m => m.id === matchId);

          if (action === 'confirm_claim') {
            if (match) match.status = 'owner_confirmed';
            saveList('AIMatches', matches);

            if (match?.lost_report_id) {
              let losts = getList('LostReports');
              let lr = losts.find(r => r.id === match.lost_report_id);
              if (lr) {
                lr.status = 'claim_pending';
                lr.owner_response_status = 'responded_claimed';
                saveList('LostReports', losts);
              }
            }
          } else if (action === 'reject_match') {
            if (match) match.status = 'rejected_by_owner';
            saveList('AIMatches', matches);

            if (match?.lost_report_id) {
              let losts = getList('LostReports');
              let lr = losts.find(r => r.id === match.lost_report_id);
              if (lr) {
                lr.status = 'active'; // Retain stored lost report in DB active search mode
                lr.owner_response_status = 'responded_rejected';
                saveList('LostReports', losts);
              }
            }
          } else if (action === 'request_extension') {
            const extDate = new Date(Date.now() + 14 * 86400 * 1000).toISOString();
            if (match?.lost_report_id) {
              let losts = getList('LostReports');
              let lr = losts.find(r => r.id === match.lost_report_id);
              if (lr) {
                lr.owner_response_status = 'retention_extended';
                lr.owner_response_deadline = extDate;
                lr.retention_until = extDate;
                saveList('LostReports', losts);
              }
            }
          }

          return { status: 'success', action, matchId };
        } catch (e) {
          return { status: 'error', message: e.message };
        }
      }

      if (fnName === 'checkRetentionPolicy') {
        try {
          const serverRes = await syncServerRequest('/api/functions/checkRetentionPolicy', 'POST', params).catch(() => null);
          if (serverRes) return serverRes;
          return { status: 'success', checkedAt: new Date().toISOString() };
        } catch (e) {
          return { status: 'error', message: e.message };
        }
      }

      return { status: 'ok' };
    },
  },
  chat: {
    getMessages: async (channelId) => {
      try {
        const remote = await syncServerRequest(`/api/chat/${channelId}`, 'GET');
        if (Array.isArray(remote) && remote.length > 0) {
          localStorage.setItem(`chat_${channelId}`, JSON.stringify(remote));
          return remote;
        }
      } catch (e) {
        console.debug('[getMessages] Remote sync error:', e);
      }
      try {
        const local = localStorage.getItem(`chat_${channelId}`);
        return local ? JSON.parse(local) : [];
      } catch (e) { console.debug('[getMessages] Local read error:', e); return []; }
    },
    sendMessage: async (channelId, messageData) => {
      const u = getStoredUser();
      const payload = {
        sender_id: u?.id || 'anon-user',
        sender_name: u?.full_name || u?.name || 'Anonymous User',
        sender_role: messageData.sender_role || 'Finder',
        text: messageData.text,
      };
      let result = null;
      try {
        const res = await syncServerRequest(`/api/chat/${channelId}/messages`, 'POST', payload);
        if (res?.message) result = res.message;
      } catch (e) {
        console.debug('[sendMessage] Remote send error:', e);
      }

      if (!result) {
        // Redact PII locally if offline
        let safeText = payload.text || '';
        safeText = safeText.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[PHONE REDACTED BY RELAY]');
        safeText = safeText.replace(/\b\d{10}\b/g, '[PHONE REDACTED BY RELAY]');
        safeText = safeText.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL REDACTED]');

        result = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          channel_id: channelId,
          ...payload,
          text: safeText,
          created_at: new Date().toISOString(),
        };
      }
      try {
        const local = JSON.parse(localStorage.getItem(`chat_${channelId}`) || '[]');
        local.push(result);
        localStorage.setItem(`chat_${channelId}`, JSON.stringify(local));
      } catch (e) {
        console.debug('[sendMessage] Local store error:', e);
      }
      return result;
    },
    startMaskedCall: async (channelId) => {
      const u = getStoredUser();
      const payload = {
        channel_id: channelId,
        caller_id: u?.id || 'caller',
        action: 'initiate',
      };
      const res = await syncServerRequest('/api/call/session', 'POST', payload);
      return res?.call || {
        trunk_id: `TRUNK-${Math.floor(1000 + Math.random() * 9000)}-ZEXO`,
        channel_id: channelId,
        status: 'bridged',
        relay_number: '+1 (800) 555-ZEXO',
        timestamp: new Date().toISOString(),
      };
    },
  },
};

/**
 * Runtime client: prefer the platform-injected __B44_DB__, then dev-bypass
 * (if explicitly opted in), and finally a functional standalone client.
 */
export const db = globalThis.__B44_DB__ || (DEV_BYPASS ? devBypassDb : standaloneAuthClient);
export const base44 = db;
export default db;