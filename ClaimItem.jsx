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
    (async () => {
      try {
        const activeUser = user || (await db.auth.me().catch(() => null));
        const m = await db.entities.AIMatches.get(matchId);
        if (!m) {
          setError('Match record not found');
          return;
        }
        setMatch(m);
      } catch (err) {
        setError('Failed to load match record');
      }
    })();
  }, [matchId, user]);

  const submit = async () => {
    if (!text && !file) return setError('Provide a private description or supporting file.');
    setBusy(true);
    try {
      let file_url = '';
      if (file) ({ file_url } = await db.integrations.Core.UploadFile({ file }));
      const activeUser = user || (await db.auth.me().catch(() => null));
      const res = await db.functions.invoke('submitClaim', {
        matchId,
        claimantId: activeUser?.id,
        evidence: [{ evidence_type: type, text_description: text, file_url }],
      });
      const claimId = res?.data?.claim?.id || res?.claim?.id || res?.id || res?.data?.id;
      if (claimId) {
        nav(`/evidence/${claimId}`);
      } else {
        nav('/dashboard');
      }
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