import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Loader2, Save } from 'lucide-react';
import { useRenameSchool } from '../hooks/useSchoolActions';
import { translateError } from '../../../i18n/errors';
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
  const { t } = useTranslation('school');
  const { school, members, sections, codes } = data;
  const [name, setName] = useState(school.name);
  const rename = useRenameSchool();

  const trimmed = name.trim();
  const nameError = trimmed.length < 2 ? t('overview.nameTooShort') : null;
  const isDirty = trimmed !== school.name;
  const count = (role) => members.filter(m => m.role === role && m.status === 'active').length;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isDirty || nameError) return;
    rename.mutate(
      { orgId: school.id, name: trimmed },
      {
        onSuccess: () => toast.success(t('overview.renamed')),
        onError: (err) => toast.error(translateError(err, t, 'overview.renameFailed')),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label={t('overview.students')} value={count('student')} />
        <Stat label={t('overview.teachers')} value={count('teacher')} />
        <Stat label={t('overview.sections')} value={sections.filter(s => !s.archived).length} />
        <Stat label={t('overview.activeCodes')} value={codes.filter(c => codeState(c) === 'active').length} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
        <div>
          <label htmlFor="school-name" className={labelClass}>{t('overview.schoolName')}</label>
          <input
            id="school-name"
            type="text"
            dir="auto"
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
          {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
        </div>
        <button type="submit" disabled={!isDirty || !!nameError || rename.isPending} className={primaryButtonClass}>
          {rename.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isDirty ? t('overview.saveName') : t('common:status.saved')}
        </button>
      </form>
    </div>
  );
}
