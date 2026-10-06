import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { useRenameSchool } from '../hooks/useSchoolActions';
import { codeState, inputClass, labelClass, primaryButtonClass } from '../utils/school';

function Stat({ label, value }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
      <p className="text-2xl font-extrabold text-slate-800">{value}</p>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}

export default function SchoolOverviewTab({ data }) {
  const { school, members, sections, codes } = data;
  const [name, setName] = useState(school.name);
  const rename = useRenameSchool();

  const trimmed = name.trim();
  const nameError = trimmed.length < 2 ? 'Use at least 2 characters.' : null;
  const isDirty = trimmed !== school.name;
  const count = (role) => members.filter(m => m.role === role && m.status === 'active').length;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isDirty || nameError) return;
    rename.mutate(
      { orgId: school.id, name: trimmed },
      {
        onSuccess: () => toast.success('School name saved.'),
        onError: (err) => toast.error(err.message || 'Could not rename the school.'),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Students" value={count('student')} />
        <Stat label="Teachers" value={count('teacher')} />
        <Stat label="Sections" value={sections.filter(s => !s.archived).length} />
        <Stat label="Active codes" value={codes.filter(c => codeState(c) === 'active').length} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
        <div>
          <label htmlFor="school-name" className={labelClass}>School name</label>
          <input
            id="school-name"
            type="text"
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
          {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
        </div>
        <button type="submit" disabled={!isDirty || !!nameError || rename.isPending} className={primaryButtonClass}>
          {rename.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isDirty ? 'Save name' : 'Saved'}
        </button>
      </form>
    </div>
  );
}
