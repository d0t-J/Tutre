import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Crown, LifeBuoy, RotateCcw, ShieldPlus, UserMinus } from 'lucide-react';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { useAuth } from '../../../context/AuthContext';
import { useMakeOrgAdmin, useSetMembershipStatus, useTransferHead } from '../hooks/useSchoolActions';
import { translateError } from '../../../i18n/errors';
import ResetPasswordButton from './ResetPasswordButton';
import { isolate } from '../../../i18n';
import { formatDate, secondaryButtonClass, dangerButtonClass } from '../utils/school';

const ROLES = ['org_admin', 'teacher', 'student'];

// What the signed-in user may do to one member. The database enforces the same
// rules (migration 20261009090000); this only decides which buttons to show.
//  * any school admin removes and restores teachers and students, restores
//    admins, and makes a teacher an admin;
//  * the head (or Tutre) also removes admins and hands over the head role.
const actionsFor = (member, { canManageAdmins, isPlatformAdmin, adminUserIds }) => {
  if (member.status !== 'active') return { restore: true };
  if (member.isMe) return {};
  if (member.role === 'org_admin') {
    return {
      makeHead: canManageAdmins && !member.isHead,
      // The head is removed only by Tutre; a school head hands over first.
      remove: canManageAdmins && (!member.isHead || isPlatformAdmin),
    };
  }
  return {
    remove: true,
    makeAdmin: member.role === 'teacher' && !adminUserIds.has(member.userId),
    // A school admin gives a teacher or student a one-time reset code.
    resetPassword: !adminUserIds.has(member.userId),
  };
};

function MemberRow({ member, sectionNames, actions, onRemove, onRestore, onMakeAdmin, onMakeHead, isPending }) {
  const { t } = useTranslation('school');
  const removed = member.status !== 'active';
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
      <span className={`text-sm font-medium ${removed ? 'text-slate-400' : 'text-slate-800'}`}>
        <bdi>{member.name}</bdi>
        {member.isMe && <span className="ms-1.5 text-xs font-bold text-primary-600">{t('members.you')}</span>}
      </span>
      {member.isHead && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
          <Crown className="w-3 h-3" /> {t('members.head')}
        </span>
      )}
      <span className="text-xs text-slate-400">
        {[sectionNames.map(isolate).join(t('common:list.separator')), t('members.joined', { date: formatDate(member.joinedAt) })]
          .filter(Boolean).join(' · ')}
      </span>
      <span className="ms-auto flex flex-wrap gap-1">
        {actions.resetPassword && <ResetPasswordButton userId={member.userId} name={member.name} />}
        {actions.restore && (
          <button type="button" onClick={() => onRestore(member)} disabled={isPending} className={secondaryButtonClass}>
            <RotateCcw className="w-3.5 h-3.5" /> {t('members.restore')}
          </button>
        )}
        {actions.makeAdmin && (
          <button type="button" onClick={() => onMakeAdmin(member)} disabled={isPending} className={secondaryButtonClass}>
            <ShieldPlus className="w-3.5 h-3.5" /> {t('members.makeAdmin')}
          </button>
        )}
        {actions.makeHead && (
          <button type="button" onClick={() => onMakeHead(member)} disabled={isPending} className={secondaryButtonClass}>
            <Crown className="w-3.5 h-3.5" /> {t('members.makeHead')}
          </button>
        )}
        {actions.remove && (
          <button type="button" onClick={() => onRemove(member)} disabled={isPending} className={dangerButtonClass}>
            <UserMinus className="w-3.5 h-3.5" /> {t('common:actions.remove')}
          </button>
        )}
      </span>
    </li>
  );
}

// Tutre's platform admins are admins of every school without being members.
function TutreSupportRow() {
  const { t } = useTranslation('school');
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-800">
        <LifeBuoy className="w-4 h-4 text-primary-600" /> {t('members.tutreSupport')}
      </span>
      <span className="text-xs text-slate-400">{t('members.tutreSupportNote')}</span>
    </li>
  );
}

export default function SchoolMembersTab({ data }) {
  const { t } = useTranslation('school');
  const { isPlatformAdmin } = useAuth();
  const [removing, setRemoving] = useState(null);
  const [handingOver, setHandingOver] = useState(null);
  const setStatus = useSetMembershipStatus();
  const makeAdmin = useMakeOrgAdmin();
  const transferHead = useTransferHead();
  const isPending = setStatus.isPending || makeAdmin.isPending || transferHead.isPending;

  const orgId = data.school.id;
  const activeAdmins = data.members.filter(m => m.role === 'org_admin' && m.status === 'active');
  const amHead = activeAdmins.some(m => m.isMe && m.isHead);
  const permissions = {
    canManageAdmins: amHead || isPlatformAdmin,
    isPlatformAdmin,
    adminUserIds: new Set(activeAdmins.map(m => m.userId)),
  };

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
  const confirmRemove = () => change(
    removing,
    'removed',
    t(removing.role === 'org_admin' ? 'members.adminRemoved' : 'members.removed', { name: removing.name }),
    () => setRemoving(null),
  );

  const handleMakeAdmin = (member) => {
    makeAdmin.mutate(
      { orgId, userId: member.userId },
      {
        onSuccess: () => toast.success(t('members.madeAdmin', { name: member.name })),
        onError: (err) => toast.error(translateError(err, t, 'members.makeAdminFailed')),
      }
    );
  };

  const confirmHandOver = () => {
    transferHead.mutate(
      { orgId, userId: handingOver.userId },
      {
        onSuccess: () => {
          toast.success(t('members.madeHead', { name: handingOver.name }));
          setHandingOver(null);
        },
        onError: (err) => toast.error(translateError(err, t, 'members.makeHeadFailed')),
      }
    );
  };

  const removingAdmin = removing?.role === 'org_admin';

  return (
    <div className="space-y-6">
      {ROLES.map(role => {
        const inRole = data.members.filter(m => m.role === role);
        const active = inRole
          .filter(m => m.status === 'active')
          .sort((a, b) => Number(b.isHead) - Number(a.isHead));
        const removed = inRole.filter(m => m.status !== 'active');
        const rowProps = {
          onRemove: setRemoving, onRestore: restore, onMakeAdmin: handleMakeAdmin, onMakeHead: setHandingOver, isPending,
        };
        return (
          <div key={role}>
            <h3 className="text-sm font-bold text-slate-700">{t(`members.group.${role}`, { count: active.length })}</h3>
            {role === 'org_admin' && (
              <p className="text-xs text-slate-400">{t('members.adminNote')}</p>
            )}
            {active.length === 0 && role !== 'org_admin' ? (
              <p className="text-xs text-slate-400 mt-1">{t('members.nobody')}</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {active.map(m => (
                  <MemberRow key={m.id} member={m} sectionNames={sectionsOf(m)}
                    actions={actionsFor(m, permissions)} {...rowProps} />
                ))}
                {role === 'org_admin' && <TutreSupportRow />}
              </ul>
            )}
            {removed.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs font-bold text-slate-500">{t('members.removedTitle', { count: removed.length })}</summary>
                <ul className="divide-y divide-slate-100">
                  {removed.map(m => (
                    <MemberRow key={m.id} member={m} sectionNames={[]}
                      actions={actionsFor(m, permissions)} {...rowProps} />
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
        title={removingAdmin ? t('members.removeAdminTitle') : t('members.removeTitle')}
        message={!removing ? '' : removingAdmin
          ? t('members.removeAdminMessage', { name: removing.name })
          : t('members.removeMessage', { name: removing.name, role: t(`common:roles.${removing.role}`) })}
        confirmText={t('common:actions.remove')}
      />

      <ConfirmationModal
        isOpen={!!handingOver}
        onClose={() => setHandingOver(null)}
        onConfirm={confirmHandOver}
        isPending={transferHead.isPending}
        title={t('members.makeHeadTitle')}
        message={handingOver ? t('members.makeHeadMessage', { name: handingOver.name }) : ''}
        confirmText={t('members.makeHead')}
        cancelText={t('common:actions.cancel')}
      />
    </div>
  );
}
