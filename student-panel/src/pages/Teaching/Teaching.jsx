import { Loader2 } from 'lucide-react';
import { TeachingSection, useMyRoles, useTeaching } from '../../features/school';

export default function Teaching() {
  const { data: sections, isLoading, error } = useTeaching();
  const { data: roles } = useMyRoles();

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-800">My sections</h1>
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading...
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">Could not load your sections. Please refresh the page.</p>
      ) : sections.length === 0 ? (
        <p className="text-sm text-slate-500">
          {roles?.hasSuspendedSchool
            ? "Your school's Tutre account is suspended. Contact your school admin."
            : "You don't teach any sections yet. Your school admin assigns teachers to sections."}
        </p>
      ) : (
        sections.map(section => <TeachingSection key={section.id} section={section} />)
      )}
    </div>
  );
}
