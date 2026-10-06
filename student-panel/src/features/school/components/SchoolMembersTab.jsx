import { useState } from 'react';
import { toast } from 'sonner';
import { RotateCcw, UserMinus } from 'lucide-react';
import { ConfirmationModal } from '../../../components/common';
import { useSetMembershipStatus } from '../hooks/useSchoolActions';
import { formatDate, secondaryButtonClass, dangerButtonClass } from '../utils/school';

const GROUPS = [
  { role: 'org_admin', title: 'School admins' },
  { role: 'teacher', title: 'Teachers' },
  { role: 'student', title: 'Students' },
];

function MemberRow({ member, sectionNames, onRemove, onRestore, isPending }) {
  const removed = member.status !== 'active';
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
      <span className={`text-sm font-medium ${removed ? 'text-slate-400' : 'text-slate-800'}`}>
        {member.name}
        {member.isMe && <span className="ml-1.5 text-xs font-bold text-primary-600">(you)</span>}
      </span>
      <span className="text-xs text-slate-400">
        {[sectionNames.join(', '), `joined ${formatDate(member.joinedAt)}`].filter(Boolean).join(' · ')}
      </span>
      <span className="ml-auto">
        {removed ? (
          <button type="button" onClick={() => onRestore(member)} disabled={isPending} className={secondaryButtonClass}>
            <RotateCcw className="w-3.5 h-3.5" /> Restore
          </button>
        ) : member.role !== 'org_admin' && !member.isMe ? (
          <button type="button" onClick={() => onRemove(member)} disabled={isPending} className={dangerButtonClass}>
            <UserMinus className="w-3.5 h-3.5" /> Remove
          </button>
        ) : null}
      </span>
    </li>
  );
}

export default function SchoolMembersTab({ data }) {
  const [removing, setRemoving] = useState(null);
  const setStatus = useSetMembershipStatus();

  // Section names per person and role, for the line under each name.
  const sectionsOf = (member) =>
    data.sections
      .filter(s => !s.archived && s.members.some(m => m.userId === member.userId && m.role === member.role))
      .map(s => s.name);

  const change = (member, status, message, done) => {
    setStatus.mutate(
      { membershipId: member.id, status },
      {
        onSuccess: () => { toast.success(message); done?.(); },
        onError: (err) => toast.error(err.message || 'Could not change the membership.'),
      }
    );
  };

  const restore = (member) => change(member, 'active', `${member.name} is a member again.`);
  const confirmRemove = () =>
    change(removing, 'removed', `${removing.name} was removed from the school.`, () => setRemoving(null));

  return (
    <div className="space-y-6">
      {GROUPS.map(({ role, title }) => {
        const inRole = data.members.filter(m => m.role === role);
        const active = inRole.filter(m => m.status === 'active');
        const removed = inRole.filter(m => m.status !== 'active');
        return (
          <div key={role}>
            <h3 className="text-sm font-bold text-slate-700">{title} ({active.length})</h3>
            {role === 'org_admin' && (
              <p className="text-xs text-slate-400">Only Tutre can remove a school admin. Add one with a school admin code.</p>
            )}
            {active.length === 0 ? (
              <p className="text-xs text-slate-400 mt-1">Nobody yet. Create a code on the Invite codes tab.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {active.map(m => (
                  <MemberRow key={m.id} member={m} sectionNames={sectionsOf(m)}
                    onRemove={setRemoving} onRestore={restore} isPending={setStatus.isPending} />
                ))}
              </ul>
            )}
            {removed.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs font-bold text-slate-500">Removed ({removed.length})</summary>
                <ul className="divide-y divide-slate-100">
                  {removed.map(m => (
                    <MemberRow key={m.id} member={m} sectionNames={[]}
                      onRemove={setRemoving} onRestore={restore} isPending={setStatus.isPending} />
                  ))}
                </ul>
              </details>
            )}
          </div>
        );
      })}

      <ConfirmationModal
        isOpen={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={confirmRemove}
        isPending={setStatus.isPending}
        isDestructive
        title="Remove from school?"
        message={removing
          ? `${removing.name} will lose their ${removing.role} access to this school and be taken off all its sections. You can restore them later, but you will need to add them to sections again.`
          : ''}
        confirmText="Remove"
      />
    </div>
  );
}
