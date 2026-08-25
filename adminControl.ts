import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { evaluateABAC } from './abacEngine.js';

const db = globalThis.__B44_DB__ || {};

/**
 * Enterprise Admin Control Endpoint
 * Server actions for:
 *  1. User suspension & activation (account_status)
 *  2. Report flagging
 *  3. Safe duplicate report merging (re-linking images & claims to prevent orphaned claims)
 *
 * Enforces role-based checks (admin only) & ABAC policies.
 * All sensitive administrative overrides automatically record an immutable trail in AdminActions (append-only).
 */
export default async function adminControl(req) {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();

    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (admin.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin role required' }, { status: 403 });
    }
    if (admin.account_status === 'suspended') {
      return Response.json({ error: 'Account suspended' }, { status: 403 });
    }

    const body = await req.json();
    const {
      action,
      userId,
      reportId,
      reportType,
      primaryReportId,
      duplicateReportId,
      reason,
      notes = '',
    } = body;

    // ── 1. USER SUSPENSION / ACTIVATION ──────────────────────────────
    if (action === 'suspend_user' || action === 'activate_user') {
      if (!userId) {
        return Response.json({ error: 'userId is required' }, { status: 400 });
      }
      if (admin.id === userId && action === 'suspend_user') {
        return Response.json({ error: 'Admins cannot suspend their own account' }, { status: 400 });
      }

      const targetUser = await base44.asServiceRole.entities.User.get(userId);
      if (!targetUser) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }

      const abacRes = evaluateABAC('suspendUser', admin, targetUser);
      if (!abacRes.authorized) {
        return Response.json({ error: abacRes.reason }, { status: 403 });
      }

      const newStatus = action === 'suspend_user' ? 'suspended' : 'active';

      await base44.asServiceRole.entities.User.update(userId, {
        account_status: newStatus,
      });

      // Record immutable append-only audit trail
      await base44.asServiceRole.entities.AdminActions.create({
        admin_id: admin.id,
        action_type: 'user_suspended',
        target_entity_type: 'User',
        target_entity_id: userId,
        notes: notes || `Account status changed to ${newStatus} for user ${userId}`,
      });

      return Response.json({
        success: true,
        userId,
        account_status: newStatus,
      });
    }

    // ── 2. REPORT FLAGGING ───────────────────────────────────────────
    if (action === 'flag_report') {
      if (!reportId || !reportType) {
        return Response.json({ error: 'reportId and reportType (lost | found) are required' }, { status: 400 });
      }

      const entityName = reportType === 'lost' ? 'LostReports' : 'FoundReports';
      const report = await base44.asServiceRole.entities[entityName].get(reportId);
      if (!report) {
        return Response.json({ error: 'Report not found' }, { status: 404 });
      }

      await base44.asServiceRole.entities[entityName].update(reportId, {
        status: 'flagged',
      });

      await base44.asServiceRole.entities.AdminActions.create({
        admin_id: admin.id,
        action_type: 'report_flagged',
        target_entity_type: entityName,
        target_entity_id: reportId,
        notes: reason || notes || `Report ${reportId} flagged by admin ${admin.id}`,
      });

      return Response.json({
        success: true,
        reportId,
        status: 'flagged',
      });
    }

    // ── 3. DUPLICATE REPORT MERGING ──────────────────────────────────
    if (action === 'merge_reports') {
      if (!primaryReportId || !duplicateReportId || !reportType) {
        return Response.json({ error: 'primaryReportId, duplicateReportId, and reportType are required' }, { status: 400 });
      }
      if (primaryReportId === duplicateReportId) {
        return Response.json({ error: 'Cannot merge a report into itself' }, { status: 400 });
      }

      const entityName = reportType === 'lost' ? 'LostReports' : 'FoundReports';
      const [primary, duplicate] = await Promise.all([
        base44.asServiceRole.entities[entityName].get(primaryReportId),
        base44.asServiceRole.entities[entityName].get(duplicateReportId),
      ]);

      if (!primary || !duplicate) {
        return Response.json({ error: 'Primary or duplicate report not found' }, { status: 404 });
      }

      // Mark duplicate report as merged
      await base44.asServiceRole.entities[entityName].update(duplicateReportId, {
        status: 'merged',
        is_duplicate_of: primaryReportId,
      });

      // Re-link images from duplicate to primary report
      const dupImages = await base44.asServiceRole.entities.ItemImages.filter({ report_id: duplicateReportId });
      for (const img of dupImages) {
        await base44.asServiceRole.entities.ItemImages.update(img.id, {
          report_id: primaryReportId,
        }).catch(() => {});
      }

      // Re-link matches and claims so claims are not orphaned
      const fieldName = reportType === 'lost' ? 'lost_report_id' : 'found_report_id';
      const dupMatches = await base44.asServiceRole.entities.AIMatches.filter({ [fieldName]: duplicateReportId });
      for (const match of dupMatches) {
        await base44.asServiceRole.entities.AIMatches.update(match.id, {
          [fieldName]: primaryReportId,
        }).catch(() => {});

        const claims = await base44.asServiceRole.entities.Claims.filter({ match_id: match.id });
        for (const claim of claims) {
          await base44.asServiceRole.entities.Claims.update(claim.id, {
            [fieldName]: primaryReportId,
          }).catch(() => {});
        }
      }

      // Record immutable append-only audit trail
      await base44.asServiceRole.entities.AdminActions.create({
        admin_id: admin.id,
        action_type: 'duplicate_merged',
        target_entity_type: entityName,
        target_entity_id: duplicateReportId,
        notes: notes || `Merged duplicate report ${duplicateReportId} into primary report ${primaryReportId}`,
      });

      return Response.json({
        success: true,
        primaryReportId,
        duplicateReportId,
        status: 'merged',
      });
    }

    return Response.json({ error: `Invalid action: ${action}` }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
