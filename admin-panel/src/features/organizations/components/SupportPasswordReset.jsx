import { useState } from 'react';
import { toast } from 'sonner';
import { KeyRound, Loader2 } from 'lucide-react';
import { supportPasswordResetCode } from '../../school/hooks/useStudentJoining';

// Tutre support: a one-time reset code for an account found by its email, for
// people with no teacher to ask, such as private learners and principals
// (Phase 5g; there is no email delivery yet). Platform admins only.
export default function SupportPasswordReset() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      setResult(await supportPasswordResetCode(email.trim()));
    } catch {
      toast.error('No account you can reset has that email.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
      <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2"><KeyRound className="w-4 h-4 text-primary-600" /> Password reset for support</h2>
      <p className="text-xs text-slate-500">
        For someone with no teacher to ask (a private learner or a principal). Check who they are first. The code works once,
        for 30 minutes, on the sign-in page under &quot;Forgot your password?&quot;.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com"
          aria-label="Email of the account" className="flex-1 min-w-56 text-sm p-2 rounded-lg border border-slate-300 bg-slate-50" />
        <button type="submit" disabled={busy || !email} className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Create reset code
        </button>
      </form>
      {result && (
        <p className="text-sm text-slate-700">
          Code: <code className="font-mono text-lg font-extrabold tracking-widest text-primary-700">{result.code}</code>
          <span className="text-xs text-slate-500"> (shown once, valid for 30 minutes)</span>
        </p>
      )}
    </section>
  );
}
