import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/PageHeader';

export default function ClaimItem() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [match, setMatch] = useState(null);
  const [type, setType] = useState('unique_description');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const m = await db.entities.AIMatches.get(matchId);
        // Verify the current user is the lost-item reporter
        const lost = await db.entities.LostReports.get(m.lost_report_id).catch(() => null);
        if (!lost || lost.reporter_id !== user.id) {
          setAccessDenied(true);
          return;
        }
        setMatch(m);
      } catch {
        setAccessDenied(true);
      }
    })();
  }, [matchId, user]);

  if (accessDenied) {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center">
        <div className="rounded-2xl border bg-white py-16 px-6">
          <p className="text-sm font-semibold text-slate-700">Access denied</p>
          <p className="mt-2 text-sm text-slate-500">
            Only the original lost-item reporter can submit an ownership claim.
          </p>
          <button
            onClick={() => nav('/matches')}
            className="mt-6 rounded-lg bg-[#0F1F3D] px-5 py-2 text-sm font-semibold text-white"
          >
            Back to My Matches
          </button>
        </div>
      </div>
    );
  }

  const submit = async () => {
    if (!text && !file) return setError('Provide a private description or supporting file.');
    setBusy(true);
    try {
      let file_url = '';
      if (file) ({ file_url } = await db.integrations.Core.UploadFile({ file }));
      const res = await db.functions.invoke('submitClaim', {
        matchId,
        evidence: [{ evidence_type: type, text_description: text, file_url }],
      });
      nav(`/evidence/${res.data.claim.id}`);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-5 sm:p-8">
      <PageHeader
        eyebrow="Private ownership claim"
        title="Prove this item is yours"
        description={`Potential match${
          match ? ` · ${match.overall_score}% similarity` : ''
        }. Evidence is visible only to you and authorized reviewers.`}
      />

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          Share details only the true owner would know. AI does not approve claims; an admin reviews
          your evidence.
        </div>
        <div className="mt-6 space-y-5">
          <div>
            <Label>Evidence type</Label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="mt-2 h-11 w-full rounded-lg border bg-white px-3 text-sm"
            >
              <option value="unique_description">Unique description</option>
              <option value="serial_number">Serial number</option>
              <option value="receipt">Receipt</option>
              <option value="photo_proof">Photo proof</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <Label>Private description</Label>
            <Textarea
              className="mt-2"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Describe a hidden mark, serial number, purchase detail, or other private proof"
            />
          </div>
          <div>
            <Label>Supporting file (optional)</Label>
            <Input className="mt-2" type="file" onChange={e => setFile(e.target.files[0])} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" onClick={submit} disabled={busy}>
            {busy ? 'Submitting securely…' : 'Submit claim for review'}
          </Button>
        </div>
      </div>
    </div>
  );
}