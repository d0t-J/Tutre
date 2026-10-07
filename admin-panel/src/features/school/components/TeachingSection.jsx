import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Users, UserMinus } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { useRemoveSectionMember } from '../hooks/useSchoolActions';
import { translateError } from '../../../i18n/errors';
import { InviteCodeList, CreateInviteCodeForm } from './InviteCodes';
import { formatDate, dangerButtonClass } from '../utils/school';

// One section on the My sections page: its students, and the student codes a
// teacher can hand out for it.
export default function TeachingSection({ section }) {
  const { t } = useTranslation('school');
  const { user } = useAuth();
  const [removing, setRemoving] = useState(null);
  const removeStudent = useRemoveSectionMember();

  const details = [section.className, section.academicYear, section.orgName].filter(Boolean).join(' · ');

  const confirmRemove = () => {
    removeStudent.mutate(
      { sectionId: section.id, userId: removing.userId, role: 'student' },
      {
        onSuccess: () => {
          toast.success(t('teaching.removed', { name: removing.name, section: section.name }));
          setRemoving(null);
        },
        onError: (err) => toast.error(translateError(err, t, 'teaching.removeFailed')),
      }
    );
  };

  return (
    <section className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
      <div>
        <h2 className="text-lg font-extrabold text-slate-800"><bdi>{section.name}</bdi></h2>
        {details && <p className="text-xs text-slate-500"><bdi>{details}</bdi></p>}
      </div>

      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-700 mb-2">
          <Users className="w-4 h-4 text-slate-400" /> {t('teaching.students', { count: section.students.length })}
        </h3>
        {section.students.length === 0 ? (
          <p className="text-xs text-slate-400">{t('teaching.noStudents')}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {section.students.map(student => (
              <li key={student.userId} className="flex items-center gap-3 py-2">
                <span className="text-sm font-medium text-slate-800"><bdi>{student.name}</bdi></span>
                <span className="text-xs text-slate-400">{t('members.joined', { date: formatDate(student.joinedAt) })}</span>
                <button
                  type="button"
                  onClick={() => setRemoving(student)}
                  className={`ms-auto ${dangerButtonClass}`}
                  title={t('teaching.removeTitle', { name: student.name })}
                >
                  <UserMinus className="w-3.5 h-3.5" /> {t('common:actions.remove')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-2">{t('teaching.codes')}</h3>
        <CreateInviteCodeForm orgId={section.orgId} roles={['student']} fixedSectionId={section.id} />
        <div className="mt-3">
          <InviteCodeList
            codes={section.codes}
            showRole={false}
            canRevoke={(code) => code.created_by === user?.id}
            emptyText={t('teaching.noCodes')}
          />
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={confirmRemove}
        isPending={removeStudent.isPending}
        isDestructive
        title={t('teaching.removeConfirmTitle')}
        message={removing ? t('teaching.removeConfirmMessage', { name: removing.name, section: section.name }) : ''}
        confirmText={t('common:actions.remove')}
      />
    </section>
  );
}
