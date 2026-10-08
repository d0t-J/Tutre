import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import {
  SchoolCodesTab, SchoolMembersTab, SchoolOverviewTab, SchoolSectionsTab, useAdminSchools, useSchoolAdmin,
} from '../../features/school';
import { inputClass } from '../../features/school/utils/school';
import SchoolMaterialsTab from '../../features/school/components/SchoolMaterialsTab';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { id: 'overview', Component: SchoolOverviewTab },
  { id: 'members', Component: SchoolMembersTab },
  { id: 'sections', Component: SchoolSectionsTab },
  { id: 'codes', Component: SchoolCodesTab },
  { id: 'materials', Component: SchoolMaterialsTab },
];

function Loading() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <Loader2 className="w-4 h-4 animate-spin" /> {t('status.loading')}
    </div>
  );
}

function SchoolAdmin({ orgId }) {
  const { t } = useTranslation('school');
  const [tab, setTab] = useState('overview');
  const { data, isLoading, error } = useSchoolAdmin(orgId);
  const { Component } = TABS.find(item => item.id === tab);

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-100">
      <div role="tablist" className="flex gap-1 p-2 border-b border-slate-100 overflow-x-auto">
        {TABS.map(item => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`cursor-pointer whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
              tab === item.id ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            {t(`tabs.${item.id}`)}
          </button>
        ))}
      </div>
      <div className="p-5 sm:p-6">
        {isLoading ? (
          <Loading />
        ) : error ? (
          <p className="text-sm text-red-600">{t('loadFailed')}</p>
        ) : (
          <Component key={orgId} data={data} />
        )}
      </div>
    </section>
  );
}

export default function SchoolPage() {
  const { t } = useTranslation('school');
  const { isPlatformAdmin, hasSuspendedSchool } = useAuth();
  const { data: schools = [], isLoading } = useAdminSchools();
  const [selected, setSelected] = useState(null);

  const orgId = selected ?? schools[0]?.id;
  const current = schools.find(s => s.id === orgId);
  // Students can ask to join only once Tutre has verified the school (Phase 5g).
  const notVerified = current && current.verified === false;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 sm:p-0 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold text-slate-800"><bdi>{current?.name ?? t('common:nav.mySchool')}</bdi></h1>
          {schools.length > 1 && (
            <select value={orgId} onChange={(e) => setSelected(e.target.value)}
              aria-label={isPlatformAdmin ? t('allSchools') : t('chooseSchool')}
              className={`${inputClass} w-auto ms-auto`}>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
        </div>
        {isLoading ? (
          <Loading />
        ) : !orgId ? (
          <p className="text-sm text-slate-500">
            {hasSuspendedSchool ? t('suspended') : t('notAdmin')}
          </p>
        ) : (
          <>
            {notVerified && (
              <p className="text-sm p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-800">{t('notVerified')}</p>
            )}
            <SchoolAdmin key={orgId} orgId={orgId} />
          </>
        )}
      </div>
    </div>
  );
}
