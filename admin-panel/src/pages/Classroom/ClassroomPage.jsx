import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TeachingSection, useTeaching } from '../../features/school';
import MyMaterials from '../../features/classroom/components/MyMaterials';
import { SchoolLibrary, TutreLibrary } from '../../features/classroom/components/Libraries';
import { useAuth } from '../../context/AuthContext';

function MySections() {
  const { t } = useTranslation('school');
  const { data: sections, isLoading, error } = useTeaching();
  const { hasSuspendedSchool } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" /> {t('common:status.loading')}
      </div>
    );
  }
  if (error) return <p className="text-sm text-red-600">{t('teaching.loadFailed')}</p>;
  if (sections.length === 0) {
    return <p className="text-sm text-slate-500">{hasSuspendedSchool ? t('teaching.suspended') : t('teaching.none')}</p>;
  }
  return <div className="space-y-6">{sections.map(section => <TeachingSection key={section.id} section={section} />)}</div>;
}

const TABS = [
  { id: 'sections', Component: MySections, boxed: false },
  { id: 'materials', Component: MyMaterials, boxed: true },
  { id: 'library', Component: SchoolLibrary, boxed: true },
  { id: 'tutre', Component: TutreLibrary, boxed: true },
];

// Classroom: a teacher's (or school admin's) sections, their own simulations and
// notes, the school library and Tutre's verified library to copy from.
export default function ClassroomPage() {
  const { t } = useTranslation('classroom');
  const [params, setParams] = useSearchParams();
  const tab = TABS.find(item => item.id === params.get('tab')) ?? TABS[0];
  const { Component } = tab;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 sm:p-0 space-y-5">
        <h1 className="text-2xl font-extrabold text-slate-800">{t('title')}</h1>
        <div role="tablist" className="flex gap-1 p-1 bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
          {TABS.map(item => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab.id === item.id}
              onClick={() => setParams(item.id === 'sections' ? {} : { tab: item.id })}
              className={`cursor-pointer whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                tab.id === item.id ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {t(`tabs.${item.id}`)}
            </button>
          ))}
        </div>
        {tab.boxed ? (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6">
            <Component />
          </section>
        ) : (
          <Component />
        )}
      </div>
    </div>
  );
}
