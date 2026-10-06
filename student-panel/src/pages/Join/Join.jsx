import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import { useRedeemCode } from '../../features/school';
import { ROLE_LABELS, inputClass, labelClass, primaryButtonClass } from '../../features/school/utils/school';

const NEXT_STEP = {
  org_admin: { to: '/school', label: 'Open My school' },
  teacher: { to: '/teaching', label: 'Open My sections' },
  student: { to: '/dashboard', label: 'Start exploring' },
};

export default function Join() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const redeem = useRedeemCode();

  const cleaned = code.toUpperCase().replace(/[^A-Z0-9]/g, '');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    redeem.mutate(cleaned, {
      onSuccess: (data) => {
        setResult(data);
        setCode('');
      },
      onError: (err) => setError(err.message || 'Could not join. Please try again.'),
    });
  };

  const next = result && NEXT_STEP[result.role];

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 lg:p-8">
      <section className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-extrabold text-slate-800">Join your school or class</h2>
        </div>
        <p className="text-sm text-slate-500 mb-5">
          Enter the code your school or teacher gave you. It has 10 letters and numbers, like ABCDE-23456.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="invite-code" className={labelClass}>Code</label>
            <input
              id="invite-code"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={14}
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(null); }}
              placeholder="ABCDE-23456"
              className={`${inputClass} font-mono text-lg tracking-widest uppercase`}
            />
            {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
          </div>
          <button type="submit" disabled={cleaned.length !== 10 || redeem.isPending} className={primaryButtonClass}>
            {redeem.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Join
          </button>
        </form>

        {result && (
          <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-sm text-slate-700">
                <p className="font-bold">
                  {result.already_member ? 'You are already a member.' : 'You joined!'}
                </p>
                <p>
                  {result.org_name}, as {ROLE_LABELS[result.role]?.toLowerCase() ?? result.role}
                  {result.section_name ? `, in ${result.section_name}` : ''}.
                </p>
                {next && (
                  <Link to={next.to} className="inline-block mt-2 text-sm font-bold text-primary-700 hover:underline">
                    {next.label}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
