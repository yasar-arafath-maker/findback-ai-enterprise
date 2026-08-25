/**
 * FindBack AI — Attribute-Based Access Control (ABAC) Engine
 * Pillar 5: Enterprise Security Hardening & ABAC Evaluation
 * 
 * Features:
 * - Policy evaluation based on Subject, Resource, Action, and Environment attributes
 * - Multi-tenant & department isolation checks
 * - Anti-privilege escalation verification
 */

export const DEFAULT_ABAC_POLICIES = [
  {
    id: 'ADMIN_DECIDE_CLAIM',
    action: 'decideClaim',
    evaluate: (subject, resource) => {
      // Must be active user with admin role
      if (!subject || subject.account_status === 'suspended') return false;
      if (subject.role !== 'admin') return false;
      // Cannot approve own claim
      if (subject.id === resource.claimant_id) return false;
      // Department / Campus scope check if defined
      if (subject.department && resource.department && subject.department !== resource.department) {
        return false;
      }
      return true;
    }
  },
  {
    id: 'SUBMIT_CLAIM_OWNER_ONLY',
    action: 'submitClaim',
    evaluate: (subject, resource) => {
      if (!subject || subject.account_status === 'suspended') return false;
      // Claimant must be the original reporter of the lost item
      if (resource.lost_reporter_id !== subject.id) return false;
      // Finder cannot submit a claim on their own found report
      if (resource.found_finder_id === subject.id) return false;
      return true;
    }
  },
  {
    id: 'COMPLETE_HANDOVER',
    action: 'completeHandover',
    evaluate: (subject, resource) => {
      if (!subject || subject.account_status === 'suspended') return false;
      // Participant check (claimant or finder) or super admin
      const isParticipant = subject.id === resource.claimant_id || subject.id === resource.finder_id;
      const isAdmin = subject.role === 'admin';
      return isParticipant || isAdmin;
    }
  },
  {
    id: 'REQUEST_EVIDENCE_ADMIN',
    action: 'requestEvidence',
    evaluate: (subject, resource) => {
      if (!subject || subject.account_status === 'suspended') return false;
      if (subject.role !== 'admin') return false;
      // Cannot request evidence on own claim
      if (subject.id === resource.claimant_id) return false;
      // Department scope check
      if (subject.department && resource.department && subject.department !== resource.department) {
        return false;
      }
      return true;
    }
  },
  {
    id: 'SUSPEND_USER_ADMIN',
    action: 'suspendUser',
    evaluate: (subject, resource) => {
      if (!subject || subject.account_status === 'suspended') return false;
      if (subject.role !== 'admin') return false;
      if (resource && subject.id === resource.id) return false;
      return true;
    }
  },
  {
    id: 'FLAG_REPORT_ADMIN',
    action: 'flagReport',
    evaluate: (subject, resource) => {
      if (!subject || subject.account_status === 'suspended') return false;
      if (subject.role !== 'admin') return false;
      return true;
    }
  },
  {
    id: 'MERGE_REPORTS_ADMIN',
    action: 'mergeReports',
    evaluate: (subject, resource) => {
      if (!subject || subject.account_status === 'suspended') return false;
      if (subject.role !== 'admin') return false;
      return true;
    }
  }
];

/**
 * Evaluates whether a subject is authorized to perform an action on a resource under ABAC rules.
 * @param {string} action - 'decideClaim' | 'submitClaim' | 'completeHandover'
 * @param {object} subject - User object { id, role, account_status, department }
 * @param {object} resource - Resource object (Claim, Handover, Report)
 * @returns {object} { authorized: boolean, reason: string }
 */
export function evaluateABAC(action, subject, resource = {}) {
  if (!subject) {
    return { authorized: false, reason: 'Unauthenticated subject' };
  }

  if (subject.account_status === 'suspended') {
    return { authorized: false, reason: 'Account is suspended (403 Forbidden)' };
  }

  const policy = DEFAULT_ABAC_POLICIES.find(p => p.action === action);
  if (!policy) {
    return { authorized: true, reason: 'No restricting ABAC policy defined' };
  }

  const isAllowed = policy.evaluate(subject, resource);
  if (!isAllowed) {
    return { authorized: false, reason: `ABAC policy ${policy.id} denied access` };
  }

  return { authorized: true, reason: 'Access granted by ABAC policy' };
}
