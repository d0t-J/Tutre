import { useState } from 'react';
import { toast } from 'sonner';
import { Users, UserMinus } from 'lucide-react';
import { useAuth } from '../../auth';
import { ConfirmationModal } from '../../../components/common';
import { useRemoveSectionMember } from '../hooks/useSchoolActions';
import { InviteCodeList, CreateInviteCodeForm } from './InviteCodes';
import { formatDate, dangerButtonClass } from '../utils/school';

// One section on the My sections page: its students, and the student codes a
// teacher can hand out for it.
export default function TeachingSection({ section }) {
  const { user } = useAuth();
  const [removing, setRemoving] = useState(null);
  const removeStudent = useRemoveSectionMember();

  const details = [section.className, section.academicYear, section.orgName].filter(Boolean).join(' · ');

  const confirmRemove = () => {
    removeStudent.mutate(
      { sectionId: section.id, userId: removing.userId, role: 'student' },
      {
        onSuccess: () => {
          toast.success(`${removing.name} was taken off ${section.name}.`);
          setRemoving(null);
        },
        onError: (err) => toast.error(err.message || 'Could not remove the student.'),
      }
    );
  };

  return (
    <section className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
      <div>
        <h2 className="text-lg font-extrabold text-slate-800">{section.name}</h2>
        {details && <p className="text-xs text-slate-500">{details}</p>}
      </div>

      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-700 mb-2">
          <Users className="w-4 h-4 text-slate-400" /> Students ({section.students.length})
        </h3>
        {section.students.length === 0 ? (
          <p className="text-xs text-slate-400">No students yet. Create a student code below and share it with your class.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {section.students.map(student => (
              <li key={student.userId} className="flex items-center gap-3 py-2">
                <span className="text-sm font-medium text-slate-800">{student.name}</span>
                <span className="text-xs text-slate-400">joined {formatDate(student.joinedAt)}</span>
                <button
                  type="button"
                  onClick={() => setRemoving(student)}
                  className={`ml-auto ${dangerButtonClass}`}
                  title={`Take ${student.name} off this section`}
                >
                  <UserMinus className="w-3.5 h-3.5" /> Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-2">Student codes</h3>
        <CreateInviteCodeForm orgId={section.orgId} roles={['student']} fixedSectionId={section.id} />
        <div className="mt-3">
          <InviteCodeList
            codes={section.codes}
            showRole={false}
            canRevoke={(code) => code.created_by === user?.id}
            emptyText="No student codes for this section yet."
          />
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={confirmRemove}
        isPending={removeStudent.isPending}
        isDestructive
        title="Remove student?"
        message={removing ? `${removing.name} will be taken off ${section.name}. They stay in the school, and can rejoin with a section code.` : ''}
        confirmText="Remove"
      />
    </section>
  );
}
