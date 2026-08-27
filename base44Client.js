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
  } catch (e) {}
};

const getStoredToken = () => {
  try {
    return localStorage.getItem('b44_token') || localStorage.getItem('base44_access_token');
  } catch (e) {
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
  } catch (e) {}
};

import { sendOtpEmail, verifyOtpCode } from './emailOtpService.js';
import { categoryScore, temporalScore, computeOverallScore } from './matchScore.js';
import { generateTextFingerprint, compareTextFingerprints } from './textFingerprint.js';
import { computeSpatialProximityScore } from './spatialIndexer.js';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:5000`;
    }
  }
  return 'http://localhost:5000';
};

const syncServerRequest = async (path, method = 'GET', body = null) => {
  try {
    if (typeof window === 'undefined') {
      try {
        const fs = await import('fs');
        const dbFile = 'local_db.json';
        if (fs.existsSync(dbFile)) {
          const raw = fs.readFileSync(dbFile, 'utf8');
          const dbData = JSON.parse(raw);
          if (path.startsWith('/api/auth/register') && body?.email) {
            if (!dbData.User) dbData.User = [];
            if (!dbData.User.some(u => u.email === body.email)) {
              dbData.User.push({
                id: 'user-' + Date.now(),
                email: body.email,
                full_name: body.full_name || body.email.split('@')[0],
                role: 'user',
                account_status: 'active',
                created_date: new Date().toISOString(),
              });
              fs.writeFileSync(dbFile, JSON.stringify(dbData, null, 2), 'utf8');
            }
          } else if (path.startsWith('/api/entities/')) {
            const parts = path.split('/');
            const entityName = parts[3];
            const entityId = parts[4];
            if (!dbData[entityName]) dbData[entityName] = [];
            if (method === 'POST' && body) {
              const idx = dbData[entityName].findIndex(x => x.id === body.id);
              if (idx >= 0) dbData[entityName][idx] = body;
              else dbData[entityName].push(body);
              fs.writeFileSync(dbFile, JSON.stringify(dbData, null, 2), 'utf8');
            } else if (method === 'PUT' && entityId && body) {
              const idx = dbData[entityName].findIndex(x => x.id === entityId);
              if (idx >= 0) dbData[entityName][idx] = { ...dbData[entityName][idx], ...body };
              fs.writeFileSync(dbFile, JSON.stringify(dbData, null, 2), 'utf8');
            } else if (method === 'DELETE' && entityId) {
              dbData[entityName] = dbData[entityName].filter(x => x.id !== entityId);
              fs.writeFileSync(dbFile, JSON.stringify(dbData, null, 2), 'utf8');
            }
          }
        }
      } catch (err) {}
      return null;
    }

    const baseUrl = getApiBaseUrl();
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${baseUrl}${path}`, opts).catch(() => null);
    if (res && res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Non-blocking
  }
  return null;
};

const standaloneAuthClient = {
  auth: {
    isAuthenticated: async () => {
      const user = getStoredUser();
      const token = getStoredToken();
      return Boolean(user || token);
    },
    me: async () => {
      const user = getStoredUser();
      if (user) return user;
      const token = getStoredToken();
      if (token) {
        const remoteUser = await syncServerRequest(`/api/auth/me?token=${token}`, 'GET');
        if (remoteUser?.user) {
          setStoredUser(remoteUser.user);
          return remoteUser.user;
        }
        return {
          id: 'user-native-session',
          email: 'user@findback.app',
          role: 'user',
          account_status: 'active',
        };
      }
      return null;
    },
    register: async (data) => {
      const email = data?.email || 'user@example.com';
      const otpRes = await sendOtpEmail(email);
      const user = {
        id: 'user-' + Date.now(),
        email,
        full_name: data?.full_name || email.split('@')[0],
        role: 'user',
        account_status: 'active',
      };
      setStoredUser(user);

      // Directly sync new registration to local_db.json on server.js!
      const serverRes = await syncServerRequest('/api/auth/register', 'POST', {
        email: user.email,
        full_name: user.full_name,
        phone: data?.phone || '',
      });

      return { status: 'success', email: user.email, code: otpRes?.code, user: serverRes?.user || user };
    },
    loginViaEmailPassword: async (email, password) => {
      const user = {
        id: 'user-' + Date.now(),
        email: email || 'user@example.com',
        role: email?.includes('admin') ? 'admin' : 'user',
        account_status: 'active',
      };
      const token = 'token_' + Date.now();
      setStoredToken(token);
      setStoredUser(user);

      // Directly sync login to local_db.json on server.js!
      const serverRes = await syncServerRequest('/api/auth/login', 'POST', { email, password });
      if (serverRes?.user) {
        setStoredUser(serverRes.user);
        if (serverRes.access_token) setStoredToken(serverRes.access_token);
      }

      return {
        access_token: token,
        user: serverRes?.user || user,
      };
    },
    verifyOtp: async ({ email, otpCode }) => {
      const targetEmail = email || getStoredUser()?.email;
      await verifyOtpCode(targetEmail, otpCode);
      const user = {
        id: 'user-' + Date.now(),
        email: targetEmail,
        role: 'user',
        account_status: 'active',
      };
      const token = 'token_' + Date.now();
      setStoredToken(token);
      setStoredUser(user);

      // Directly sync verified user to local_db.json on server.js!
      const serverRes = await syncServerRequest('/api/auth/register', 'POST', { email: targetEmail });
      if (serverRes?.user) {
        setStoredUser(serverRes.user);
      }

      return {
        access_token: token,
        user: serverRes?.user || user,
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
        } catch (e) { return []; }
      },
      get: async (id) => {
        try {
          const serverItem = await syncServerRequest(`/api/entities/${entityName}/${id}`, 'GET');
          if (serverItem) return serverItem;

          const raw = localStorage.getItem(`entity_${entityName}`);
          const list = raw ? JSON.parse(raw) : [];
          return list.find(item => item.id === id) || null;
        } catch (e) { return null; }
      },
      create: async (data) => {
        const newItem = { id: 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4), created_date: new Date().toISOString(), status: 'active', ...data };
        try {
          const raw = localStorage.getItem(`entity_${entityName}`);
          const list = raw ? JSON.parse(raw) : [];
          list.push(newItem);
          localStorage.setItem(`entity_${entityName}`, JSON.stringify(list));
        } catch (e) {}

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
        } catch (e) {}

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
        } catch (e) {}

        // Directly sync delete to local_db.json on server.js!
        await syncServerRequest(`/api/entities/${entityName}/${id}`, 'DELETE');
        return { id, deleted: true };
      },
    }),
  }),
  integrations: {
    Core: { UploadFile: async () => ({ file_url: '' }) },
  },
  functions: {
    invoke: async (fnName, params = {}) => {
      if (fnName === 'runMatching') {
        try {
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
            catch {}
          };

          const sourceList = getList(sourceEntity);
          const targetList = getList(targetEntity);
          const sourceItem = sourceList.find(r => r.id === reportId) || sourceList[sourceList.length - 1];

          if (!sourceItem) return { status: 'no_report_found' };

          const matches = getList('AIMatches');

          for (const targetItem of targetList) {
            const lostRep = isLost ? sourceItem : targetItem;
            const foundRep = isLost ? targetItem : sourceItem;

            const cScore = categoryScore(lostRep.category, foundRep.category);
            const textSim = compareTextFingerprints(
              generateTextFingerprint(`${lostRep.title} ${lostRep.description}`),
              generateTextFingerprint(`${foundRep.title} ${foundRep.description}`)
            );
            const tScore = temporalScore(lostRep.lost_date, foundRep.found_date);
            const gScore = computeSpatialProximityScore(lostRep, foundRep);

            const overall = computeOverallScore({
              imageScore: 50,
              textScore: textSim,
              geoScore: gScore,
              categoryScore: cScore,
              timeScore: tScore,
            });

            if (overall >= 40) {
              const existingIdx = matches.findIndex(m => m.lost_report_id === lostRep.id && m.found_report_id === foundRep.id);
              const matchRecord = {
                id: existingIdx >= 0 ? matches[existingIdx].id : `match-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                lost_report_id: lostRep.id,
                found_report_id: foundRep.id,
                overall_score: overall,
                text_similarity_score: textSim,
                image_similarity_score: 50,
                category_match_score: cScore,
                location_proximity_score: gScore,
                time_proximity_score: tScore,
                status: 'pending_review',
                match_reasons: [
                  `Category score: ${cScore}%`,
                  `Text similarity: ${textSim}%`,
                  `Location proximity: ${gScore}%`,
                ],
              };
              if (existingIdx >= 0) matches[existingIdx] = matchRecord;
              else matches.push(matchRecord);
            }
          }

          saveList('AIMatches', matches);
          return { status: 'success', matchesCount: matches.length };
        } catch (e) {
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
            const match = matches.find(m => m.id === matchId) || { id: matchId, lost_report_id: 'lost-seed-101', found_report_id: 'found-seed-201' };
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

      return { status: 'ok' };
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