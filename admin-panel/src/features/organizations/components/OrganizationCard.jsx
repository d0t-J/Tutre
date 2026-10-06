import { useState } from 'react';
import { toast } from 'sonner';
import { KeyRound, Pause, Play, RotateCcw, UserMinus } from 'lucide-react';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import {
  useCreateAdminCode, useRevokeCode, useSetAdminStatus, useSetOrganizationStatus,
} from '../hooks/useOrganizations';
import { codeState, formatCode, formatDate } from '../utils/codes';
import CodeBadge from './CodeBadge';

const smallButton =
  'cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';
const dangerButton =
  'cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function OrganizationCard({ org }) {
  const [confirm, setConfirm] = useState(null); // { kind: 'suspend' } or { kind: 'remove', admin }
  const [newCode, setNewCode] = useState(null);
  const setStatus = useSetOrganizationStatus();
  const createCode = useCreateAdminCode();
  const revokeCode = useRevokeCode();
  const setAdminStatus = useSetAdminStatus();

  const suspended = org.status !== 'active';
  const activeAdmins = org.admins.filter(a => a.status === 'active');
  const removedAdmins = org.admins.filter(a => a.status !== 'active');
  const activeCodes = org.adminCodes.filter(c => codeState(c) === 'active');

  const onError = (fallback) => (err) => toast.error(err.message || fallback);

  const changeStatus = (status) => {
    setStatus.mutate(
      { orgId: org.id, status },
      {
        onSuccess: () => {
          toast.success(status === 'active' ? `${org.name} is active again.` : `${org.name} suspended.`);
          setConfirm(null);
        },
        onError: onError('Could not change the school\'s status.'),
      }
    );
  };

  const changeAdmin = (admin, status) => {
    setAdminStatus.mutate(
      { membershipId: admin.id, status },
      {
        onSuccess: () => {
          toast.success(status === 'active' ? `${admin.name} is a school admin again.` : `${admin.name} is no longer a school admin.`);
          setConfirm(null);
        },
        onError: onError('Could not change the school admin.'),
      }
    );
  };

  const issueCode = () => {
    createCode.mutate(
      { orgId: org.id },
      { onSuccess: (data) => setNewCode(data), onError: onError('Could not create the code.') }
    );
  };

  return (
    <li className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-extrabold text-slate-800">{org.name}</h3>
        <span className="font-mono text-xs text-slate-400">{org.slug}</span>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${suspended ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {suspended ? 'Suspended' : 'Active'}
        </span>
        <span className="ml-auto">
          {suspended ? (
            <button type="button" onClick={() => changeStatus('active')} disabled={setStatus.isPending} className={smallButton}>
              <Play className="w-3.5 h-3.5" /> Reactivate
            </button>
          ) : (
            <button type="button" onClick={() => setConfirm({ kind: 'suspend' })} disabled={setStatus.isPending} className={dangerButton}>
              <Pause className="w-3.5 h-3.5" /> Suspend
            </button>
          )}
        </span>
      </div>

      <p className="text-xs text-slate-500">
        {plural(org.counts.students, 'student')} · {plural(org.counts.teachers, 'teacher')} · {plural(org.counts.sections, 'section')} · created {formatDate(org.created_at)}
      </p>

      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">School admins ({activeAdmins.length})</p>
        {activeAdmins.length === 0 ? (
          <p className="text-xs text-slate-400">Nobody has used the school admin code yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {activeAdmins.map(admin => (
              <li key={admin.id} className="flex items-center gap-2 py-1.5">
                <span className="text-sm text-slate-800">{admin.name}</span>
                <button type="button" onClick={() => setConfirm({ kind: 'remove', admin })}
                  disabled={setAdminStatus.isPending} className={`ml-auto ${dangerButton}`}>
                  <UserMinus className="w-3.5 h-3.5" /> Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        {removedAdmins.length > 0 && (
          <details className="mt-1">
            <summary className="cursor-pointer text-xs font-bold text-slate-500">Removed ({removedAdmins.length})</summary>
            <ul className="divide-y divide-slate-100">
              {removedAdmins.map(admin => (
                <li key={admin.id} className="flex items-center gap-2 py-1.5">
                  <span className="text-sm text-slate-400">{admin.name}</span>
                  <button type="button" onClick={() => changeAdmin(admin, 'active')}
                    disabled={setAdminStatus.isPending} className={`ml-auto ${smallButton}`}>
                    <RotateCcw className="w-3.5 h-3.5" /> Restore
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">School admin codes</p>
          <button type="button" onClick={issueCode} disabled={createCode.isPending || suspended} className={`ml-auto ${smallButton}`}
            title={suspended ? 'Reactivate the school first' : undefined}>
            <KeyRound className="w-3.5 h-3.5" /> New school admin code
          </button>
        </div>
        {newCode && (
          <CodeBadge code={newCode.code} note={`1 use · expires ${formatDate(newCode.expires_at)}`} />
        )}
        {activeCodes.length === 0 ? (
          <p className="text-xs text-slate-400">No unused school admin codes.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {activeCodes.map(code => (
              <li key={code.id} className="flex items-center gap-3 py-1.5">
                <code className="font-mono text-sm font-bold tracking-wider text-slate-800">{formatCode(code.code)}</code>
                <span className="text-xs text-slate-400">expires {formatDate(code.expires_at)}</span>
                <button type="button" disabled={revokeCode.isPending} className={`ml-auto ${dangerButton}`}
                  onClick={() => revokeCode.mutate(code.id, {
                    onSuccess: () => {
                      toast.success(`Code ${formatCode(code.code)} revoked.`);
                      if (newCode?.id === code.id) setNewCode(null);
                    },
                    onError: onError('Could not revoke the code.'),
                  })}>
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmationModal
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => (confirm?.kind === 'suspend' ? changeStatus('suspended') : changeAdmin(confirm.admin, 'removed'))}
        isPending={setStatus.isPending || setAdminStatus.isPending}
        isDestructive
        title={confirm?.kind === 'suspend' ? 'Suspend school?' : 'Remove school admin?'}
        message={confirm?.kind === 'suspend'
          ? `Members of ${org.name} lose their school screens and its codes stop working until you reactivate it. Nothing is deleted, and students can still use the public library.`
          : confirm
            ? `${confirm.admin.name} will no longer manage ${org.name}. A school must keep at least one admin. You can restore them later.`
            : ''}
        confirmText={confirm?.kind === 'suspend' ? 'Suspend' : 'Remove'}
      />
    </li>
  );
}
