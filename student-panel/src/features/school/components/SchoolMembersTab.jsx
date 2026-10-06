import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { RotateCcw, UserMinus } from 'lucide-react';
import { ConfirmationModal } from '../../../components/common';
import { useSetMembershipStatus } from '../hooks/useSchoolActions';
import { translateError } from '../../../i18n/errors';
import { isolate } from '../../../i18n';
import { formatDate, secondaryButtonClass, dangerButtonClass } from '../utils/school';

const ROLES = ['org_admin', 'teacher', 'student'];

function MemberRow({ member, sectionNames, onRemove, onRestore, isPending }) {
  const { t } = useTranslation('school');
  const removed = member.status !== 'active';
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
      <span className={`text-sm font-medium ${removed ? 'text-slate-400' : 'text-slate-800'}`}>
        <bdi>{member.name}</bdi>
        {member.isMe && <span className="ms-1.5 text-xs font-bold text-primary-600">{t('members.you')}</span>}
      </span>
      <span className="text-xs text-slate-400">
        {[sectionNames.map(isolate).join(t('common:list.separator')), t('members.joined', { date: formatDate(member.joinedAt) })]
          .filter(Boolean).join(' · ')}
      </span>
      <span className="ms-auto">
        {removed ? (
          <button type="button" onClick={() => onRestore(member)} disabled={isPending} className={secondaryButtonClass}>
            <RotateCcw className="w-3.5 h-3.5" /> {t('members.restore')}
          </button>
        ) : member.role !== 'org_admin' && !member.isMe ? (
          <button type="button" onClick={() => onRemove(member)} disabled={isPending} className={dangerButtonClass}>
            <UserMinus className="w-3.5 h-3.5" /> {t('common:actions.remove')}
          </button>
        ) : null}
      </span>
    </li>
  );
}

export default function SchoolMembersTab({ data }) {
  const { t } = useTranslation('school');
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
        onError: (err) => toast.error(translateError(err, t, 'members.changeFailed')),
      }
    );
  };

  const restore = (member) => change(member, 'active', t('members.restored', { name: member.name }));
  const confirmRemove = () =>
    change(removing, 'removed', t('members.removed', { name: removing.name }), () => setRemoving(null));

  return (
    <div className="space-y-6">
      {ROLES.map(role => {
        const inRole = data.members.filter(m => m.role === role);
        const active = inRole.filter(m => m.status === 'active');
        const removed = inRole.filter(m => m.status !== 'active');
        return (
          <div key={role}>
            <h3 className="text-sm font-bold text-slate-700">{t(`members.group.${role}`, { count: active.length })}</h3>
            {role === 'org_admin' && (
              <p className="text-xs text-slate-400">{t('members.adminNote')}</p>
            )}
            {active.length === 0 ? (
              <p className="text-xs text-slate-400 mt-1">{t('members.nobody')}</p>
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
                <summary className="cursor-pointer text-xs font-bold text-slate-500">{t('members.removedTitle', { count: removed.length })}</summary>
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
        title={t('members.removeTitle')}
        message={removing
          ? t('members.removeMessage', { name: removing.name, role: t(`common:roles.${removing.role}`) })
          : ''}
        confirmText={t('common:actions.remove')}
      />
    </div>
  );
}
