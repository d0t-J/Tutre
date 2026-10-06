import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Copy, KeyRound, Loader2, Plus } from 'lucide-react';
import { useCreateInviteCode, useRevokeInviteCode } from '../hooks/useSchoolActions';
import {
  ROLE_LABELS, codeState, formatCode, formatDate,
  inputClass, labelClass, primaryButtonClass, secondaryButtonClass, dangerButtonClass,
} from '../utils/school';

const STATE_STYLES = {
  active: 'bg-emerald-50 text-emerald-700',
  expired: 'bg-slate-100 text-slate-500',
  'used up': 'bg-slate-100 text-slate-500',
  revoked: 'bg-red-50 text-red-600',
};

export function CopyCodeButton({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatCode(code));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy. Select the code and copy it by hand.');
    }
  };
  return (
    <button type="button" onClick={copy} className={secondaryButtonClass} title="Copy code">
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// A list of invite codes. canRevoke(code) decides which rows get a Revoke button.
export function InviteCodeList({ codes, sectionNames = {}, canRevoke, showRole = true, emptyText = 'No codes yet.' }) {
  const revoke = useRevokeInviteCode();

  if (codes.length === 0) {
    return <p className="text-xs text-slate-400">{emptyText}</p>;
  }

  const handleRevoke = (code) => {
    revoke.mutate(code.id, {
      onSuccess: () => toast.success(`Code ${formatCode(code.code)} revoked. It can no longer be used.`),
      onError: (err) => toast.error(err.message || 'Could not revoke the code.'),
    });
  };

  return (
    <ul className="divide-y divide-slate-100">
      {codes.map(code => {
        const state = codeState(code);
        const details = [
          showRole && ROLE_LABELS[code.role],
          code.section_id && sectionNames[code.section_id],
          `${code.uses} of ${code.max_uses} used`,
          state === 'active' ? `expires ${formatDate(code.expires_at)}` : null,
        ].filter(Boolean).join(' · ');

        return (
          <li key={code.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
            <code className={`font-mono text-sm font-bold tracking-wider ${state === 'active' ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
              {formatCode(code.code)}
            </code>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${STATE_STYLES[state]}`}>{state}</span>
            <span className="text-xs text-slate-500 min-w-0">{details}</span>
            {state === 'active' && (
              <span className="ml-auto flex items-center gap-1">
                <CopyCodeButton code={code.code} />
                {canRevoke(code) && (
                  <button
                    type="button"
                    onClick={() => handleRevoke(code)}
                    disabled={revoke.isPending}
                    className={dangerButtonClass}
                  >
                    Revoke
                  </button>
                )}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const DEFAULT_USES = { student: 40, teacher: 1, org_admin: 1 };

// Creates a code. roles lists the roles this user may create codes for;
// sections, when given, lets the user tie a teacher or student code to one
// section. fixedSectionId ties every code to that section instead.
export function CreateInviteCodeForm({ orgId, roles, sections = [], fixedSectionId = null }) {
  const [role, setRole] = useState(roles[0]);
  const [sectionId, setSectionId] = useState('');
  const [maxUses, setMaxUses] = useState(DEFAULT_USES[roles[0]]);
  const [validDays, setValidDays] = useState(14);
  const [created, setCreated] = useState(null);
  const createCode = useCreateInviteCode();

  const sectionAllowed = role !== 'org_admin' && !fixedSectionId && sections.length > 0;

  const handleRoleChange = (next) => {
    setRole(next);
    setMaxUses(DEFAULT_USES[next]);
    if (next === 'org_admin') setSectionId('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createCode.mutate(
      {
        orgId,
        role,
        sectionId: fixedSectionId ?? (sectionId || null),
        maxUses: Number(maxUses),
        validDays: Number(validDays),
      },
      {
        onSuccess: (data) => setCreated(data),
        onError: (err) => toast.error(err.message || 'Could not create the code.'),
      }
    );
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        {roles.length > 1 && (
          <div>
            <label className={labelClass} htmlFor={`code-role-${orgId}`}>For a</label>
            <select id={`code-role-${orgId}`} value={role} onChange={(e) => handleRoleChange(e.target.value)} className={inputClass}>
              {roles.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
        )}
        {sectionAllowed && (
          <div className="min-w-40">
            <label className={labelClass} htmlFor={`code-section-${orgId}`}>Section</label>
            <select id={`code-section-${orgId}`} value={sectionId} onChange={(e) => setSectionId(e.target.value)} className={inputClass}>
              <option value="">School only</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
        <div className="w-24">
          <label className={labelClass} htmlFor={`code-uses-${orgId}-${fixedSectionId ?? ''}`}>Uses</label>
          <input
            id={`code-uses-${orgId}-${fixedSectionId ?? ''}`}
            type="number" min={1} max={1000} required
            value={maxUses} onChange={(e) => setMaxUses(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="w-24">
          <label className={labelClass} htmlFor={`code-days-${orgId}-${fixedSectionId ?? ''}`}>Days</label>
          <input
            id={`code-days-${orgId}-${fixedSectionId ?? ''}`}
            type="number" min={1} max={90} required
            value={validDays} onChange={(e) => setValidDays(e.target.value)}
            className={inputClass}
          />
        </div>
        <button type="submit" disabled={createCode.isPending} className={primaryButtonClass}>
          {createCode.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          New code
        </button>
      </form>

      {created && (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-primary-50 border border-primary-100">
          <KeyRound className="w-4 h-4 text-primary-600" />
          <code className="font-mono text-lg font-extrabold tracking-wider text-primary-700">{formatCode(created.code)}</code>
          <span className="text-xs text-slate-600">
            {ROLE_LABELS[created.role]} code · {created.max_uses} {created.max_uses === 1 ? 'use' : 'uses'} · expires {formatDate(created.expires_at)}
          </span>
          <span className="ml-auto"><CopyCodeButton code={created.code} /></span>
        </div>
      )}
    </div>
  );
}
