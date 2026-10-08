import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BadgeCheck, Loader2, ShieldAlert } from 'lucide-react';
import { setSchoolVerification } from '../../school/hooks/useStudentJoining';

const button =
  'cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

// Tutre verifies a school before its students can ask to join (Phase 5g),
// optionally recording its government EMIS code. Only platform admins see
// this; the database refuses anyone else.
export default function SchoolVerification({ org }) {
  const queryClient = useQueryClient();
  const [emis, setEmis] = useState(org.emis_code ?? '');
  const [busy, setBusy] = useState(false);
  const verified = !!org.verified_at;

  const save = async (nextVerified) => {
    setBusy(true);
    try {
      await setSchoolVerification({ orgId: org.id, verified: nextVerified, emisCode: emis.trim() });
      await queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success(nextVerified ? `${org.name} is verified. Its students can ask to join.` : `${org.name} is no longer verified.`);
    } catch (err) {
      toast.error(/23514|check constraint/i.test(err.message)
        ? 'An EMIS code has 3 to 20 letters, digits or hyphens.'
        : /duplicate|unique/i.test(err.message) ? 'Another school already has that EMIS code.' : 'Could not change the verification.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
      {verified ? (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><BadgeCheck className="w-4 h-4" /> Verified</span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700"><ShieldAlert className="w-4 h-4" /> Not verified: students cannot ask to join</span>
      )}
      <label className="ml-auto flex items-center gap-1.5 text-xs text-slate-500">
        EMIS code
        <input type="text" value={emis} maxLength={20} onChange={(e) => setEmis(e.target.value)} placeholder="optional"
          className="w-32 text-xs p-1.5 rounded-md border border-slate-300 bg-white font-mono" />
      </label>
      {verified ? (
        <>
          <button type="button" disabled={busy} onClick={() => save(true)} className={button}>Save code</button>
          <button type="button" disabled={busy} onClick={() => save(false)} className={`${button} text-red-600`}>Remove verification</button>
        </>
      ) : (
        <button type="button" disabled={busy} onClick={() => save(true)} className={button}>
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BadgeCheck className="w-3.5 h-3.5" />} Verify school
        </button>
      )}
    </div>
  );
}
