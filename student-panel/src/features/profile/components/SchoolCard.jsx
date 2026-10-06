import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { KeyRound, School, Users } from 'lucide-react';

function SectionRow({ section }) {
  const { t } = useTranslation('profile');
  const details = [section.className, section.academicYear].filter(Boolean).join(' · ');
  const teachers = section.teachers.join(t('common:list.separator'));
  return (
    <li className="flex items-start gap-3 py-2.5">
      <Users className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-800">
          <bdi>{section.name}</bdi>
          {details && <span className="ms-2 text-xs font-medium text-slate-500"><bdi>{details}</bdi></span>}
          {section.role === 'teacher' && (
            <span className="ms-2 text-[10px] font-bold uppercase tracking-wider text-primary-600">{t('school.youTeach')}</span>
          )}
        </p>
        {section.teachers.length > 0 && (
          <p className="text-xs text-slate-500">
            {section.role === 'teacher'
              ? t('school.alsoTaughtBy', { teachers })
              : t('school.taughtBy', { teachers })}
          </p>
        )}
      </div>
    </li>
  );
}

function JoinLink({ label }) {
  return (
    <Link to="/join" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-700 hover:underline">
      <KeyRound className="w-4 h-4" /> {label}
    </Link>
  );
}

export default function SchoolCard({ schools }) {
  const { t } = useTranslation('profile');

  if (schools.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-slate-500">{t('school.none')}</p>
        <JoinLink label={t('school.join')} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {schools.map(school => (
        <div key={school.id}>
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-primary-600" />
            <p className="text-sm font-extrabold text-slate-800"><bdi>{school.name}</bdi></p>
            {school.status !== 'active' && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">{t('school.suspended')}</span>
            )}
          </div>
          <p className="ms-6 text-xs text-slate-500">
            {school.roles.map(role => t(`common:roles.${role}`)).join(t('common:list.separator'))}
          </p>
          {school.sections.length > 0 ? (
            <ul className="ms-6 mt-1 divide-y divide-slate-100">
              {school.sections.map(section => (
                <SectionRow key={`${section.id}-${section.role}`} section={section} />
              ))}
            </ul>
          ) : (
            <p className="ms-6 mt-1 text-xs text-slate-400">{t('school.noSections')}</p>
          )}
        </div>
      ))}
      <JoinLink label={t('school.joinAnother')} />
    </div>
  );
}
