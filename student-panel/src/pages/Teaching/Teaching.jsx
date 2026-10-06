import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TeachingSection, useMyRoles, useTeaching } from '../../features/school';

export default function Teaching() {
  const { t } = useTranslation('school');
  const { data: sections, isLoading, error } = useTeaching();
  const { data: roles } = useMyRoles();

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-800">{t('common:nav.mySections')}</h1>
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" /> {t('common:status.loading')}
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">{t('teaching.loadFailed')}</p>
      ) : sections.length === 0 ? (
        <p className="text-sm text-slate-500">
          {roles?.hasSuspendedSchool ? t('teaching.suspended') : t('teaching.none')}
        </p>
      ) : (
        sections.map(section => <TeachingSection key={section.id} section={section} />)
      )}
    </div>
  );
}
