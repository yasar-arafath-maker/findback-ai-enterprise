import { useEffect, useState } from 'react';
import { db } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/PageHeader';
import { UserCheck, ShieldCheck } from 'lucide-react';

export default function Profile() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const u = authUser || (await db.auth.me().catch(() => null)) || { email: 'user@example.com', role: 'user', full_name: 'Demo User' };
      setUser(u);
      setPhone(u.phone || '');
      setFullName(u.full_name || u.email?.split('@')[0] || '');
    })();
  }, [authUser]);

  const save = async () => {
    try {
      const updated = { ...user, phone, full_name: fullName };
      setUser(updated);
      try {
        localStorage.setItem('b44_user', JSON.stringify(updated));
      } catch {}
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Failed to update profile: ' + err.message);
    }
  };

  if (!user) {
    return <div className="p-8 text-sm text-slate-500 animate-pulse">Loading profile…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl p-5 sm:p-8 animate-fade-in-up">
      <PageHeader
        eyebrow="Account Settings"
        title="Profile & Contact Info"
        description="Keep your contact details current for secure supervised handover coordination."
      />
      <div className="space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div>
          <Label>Full Name</Label>
          <Input
            className="mt-2 h-11"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Enter your full name"
          />
        </div>
        <div>
          <Label>Email Address</Label>
          <Input className="mt-2 h-11 bg-slate-50 text-slate-500" value={user.email || ''} disabled />
        </div>
        <div>
          <Label>Phone Number (for Handover SMS alerts)</Label>
          <Input
            className="mt-2 h-11"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
          />
        </div>
        <div>
          <Label>Account Role</Label>
          <div className="mt-2 flex items-center justify-between rounded-xl border bg-slate-50 px-4 py-3 text-sm font-semibold capitalize text-slate-700">
            <span className="flex items-center">
              <UserCheck className="mr-2 h-4 w-4 text-blue-600" /> {user.role || 'user'}
            </span>
            <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="mr-1 h-3 w-3" /> Verified Status
            </span>
          </div>
        </div>
        {saved && (
          <p className="text-sm font-semibold text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            Profile updated successfully.
          </p>
        )}
        <Button onClick={save} className="w-full btn-interactive bg-blue-600 hover:bg-blue-700 h-11 font-semibold">
          Save Account Changes
        </Button>
      </div>
    </div>
  );
}