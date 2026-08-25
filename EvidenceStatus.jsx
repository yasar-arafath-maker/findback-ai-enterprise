import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { db } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/PageHeader';
import { CheckCircle2, Clock, AlertTriangle, FileText, Upload, Loader2 } from 'lucide-react';

const STATUS_CONFIG = {
  submitted:            { label: 'Submitted',           color: 'bg-blue-50 text-blue-700',   icon: Clock },
  under_review:         { label: 'Under Review',        color: 'bg-amber-50 text-amber-700', icon: Clock },
  evidence_requested:   { label: 'Evidence Requested',  color: 'bg-orange-50 text-orange-700', icon: AlertTriangle },
  approved:             { label: 'Approved',            color: 'bg-green-50 text-green-700', icon: CheckCircle2 },
  rejected:             { label: 'Rejected',            color: 'bg-red-50 text-red-700',     icon: AlertTriangle },
  handover_scheduled:   { label: 'Handover Scheduled',  color: 'bg-violet-50 text-violet-700', icon: CheckCircle2 },
  completed:            { label: 'Completed',           color: 'bg-green-50 text-green-700', icon: CheckCircle2 },
};

export default function EvidenceStatus() {
  const { claimId } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);

  // Supplementary evidence form state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [evidenceType, setEvidenceType] = useState('unique_description');
  const [evidenceText, setEvidenceText] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const loadData = async () => {
    try {
      const [claim, evidence] = await Promise.all([
        db.entities.Claims.get(claimId),
        db.entities.OwnershipEvidence.filter({ claim_id: claimId }),
      ]);

      // Verify the current user is the claimant
      if (user && claim.claimant_id !== user.id && user.role !== 'admin') {
        setAccessDenied(true);
        return;
      }

      setData({ claim, evidence });
    } catch {
      setAccessDenied(true);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [claimId, user]);

  if (accessDenied) {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center">
        <div className="rounded-2xl border bg-white py-16 px-6">
          <p className="text-sm font-semibold text-slate-700">Access denied</p>
          <p className="mt-2 text-sm text-slate-500">
            You can only view evidence for your own claims.
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-sm text-slate-500">Loading verification status…</div>;
  }

  const { claim, evidence } = data;
  const statusCfg = STATUS_CONFIG[claim.status] || STATUS_CONFIG.submitted;
  const StatusIcon = statusCfg.icon;
  const canSubmitMore = ['evidence_requested', 'submitted', 'under_review'].includes(claim.status);

  const handleSupplementarySubmit = async () => {
    if (!evidenceText && !evidenceFile) {
      setUploadError('Provide a description or supporting file.');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      let file_url = '';
      if (evidenceFile) {
        ({ file_url } = await db.integrations.Core.UploadFile({ file: evidenceFile }));
      }
      await db.functions.invoke('submitClaim', {
        claimId: claim.id,
        evidence: [{ evidence_type: evidenceType, text_description: evidenceText, file_url }],
      });
      // Reset form and reload
      setEvidenceText('');
      setEvidenceFile(null);
      setShowUploadForm(false);
      await loadData();
    } catch (e) {
      setUploadError(e.response?.data?.error || e.message || 'Failed to submit evidence');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-5 sm:p-8">
      <PageHeader
        eyebrow="Ownership verification"
        title="Claim evidence"
        description="Your private evidence is visible only to you and authorized reviewers."
      />

      <div className="rounded-2xl border bg-white p-6">
        {/* ── Status Header ──────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4" />
            <span className="font-semibold">Claim status</span>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
        </div>

        {/* ── Admin Review Notes (shown when evidence requested or rejected) ── */}
        {claim.review_notes && ['evidence_requested', 'rejected'].includes(claim.status) && (
          <div className={`mt-4 rounded-xl p-4 text-sm ${
            claim.status === 'evidence_requested'
              ? 'bg-orange-50 border border-orange-200 text-orange-900'
              : 'bg-red-50 border border-red-200 text-red-900'
          }`}>
            <p className="font-semibold">
              {claim.status === 'evidence_requested' ? 'Admin requested additional evidence:' : 'Reviewer notes:'}
            </p>
            <p className="mt-2 whitespace-pre-wrap">{claim.review_notes}</p>
          </div>
        )}

        {/* ── Submitted Evidence List ────────────────────────────── */}
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">
            Submitted evidence ({evidence.length})
          </h3>
          {evidence.map(e => (
            <div key={e.id} className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold capitalize">
                  <FileText className="mr-1.5 inline h-3.5 w-3.5 text-slate-400" />
                  {e.evidence_type.replace(/_/g, ' ')}
                </p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  e.verified ? 'bg-green-50 text-green-700' : 'bg-slate-200 text-slate-600'
                }`}>
                  {e.verified ? 'Verified' : 'Pending'}
                </span>
              </div>
              {e.text_description && (
                <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{e.text_description}</p>
              )}
              {e.file_url && (
                <a
                  href={e.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs font-semibold text-blue-600 hover:underline"
                >
                  Open evidence file ↗
                </a>
              )}
            </div>
          ))}
          {!evidence.length && (
            <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              No evidence has been submitted yet.
            </p>
          )}
        </div>

        {/* ── Supplementary Evidence Upload ──────────────────────── */}
        {canSubmitMore && (
          <div className="mt-6">
            {!showUploadForm ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowUploadForm(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                {claim.status === 'evidence_requested'
                  ? 'Upload requested evidence'
                  : 'Add more evidence'}
              </Button>
            ) : (
              <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-5 space-y-4">
                <h3 className="text-sm font-semibold">Submit additional evidence</h3>
                <div>
                  <Label>Evidence type</Label>
                  <select
                    value={evidenceType}
                    onChange={e => setEvidenceType(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-sm"
                  >
                    <option value="unique_description">Unique description</option>
                    <option value="serial_number">Serial number</option>
                    <option value="receipt">Receipt</option>
                    <option value="photo_proof">Photo proof</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    className="mt-1.5"
                    value={evidenceText}
                    onChange={e => setEvidenceText(e.target.value)}
                    placeholder="Describe your additional proof"
                  />
                </div>
                <div>
                  <Label>Supporting file (optional)</Label>
                  <Input
                    className="mt-1.5"
                    type="file"
                    onChange={e => setEvidenceFile(e.target.files[0])}
                  />
                </div>
                {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
                <div className="flex gap-3">
                  <Button onClick={handleSupplementarySubmit} disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading…
                      </>
                    ) : (
                      'Submit evidence'
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => { setShowUploadForm(false); setUploadError(''); }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Approved → Handover Link ──────────────────────────── */}
        {claim.status === 'approved' && (
          <Link
            to="/handover"
            className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
          >
            View handover details
          </Link>
        )}
      </div>
    </div>
  );
}