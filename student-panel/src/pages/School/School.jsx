import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  SchoolCodesTab, SchoolMembersTab, SchoolOverviewTab, SchoolSectionsTab, useMyRoles, useSchoolAdmin,
} from '../../features/school';
import { inputClass } from '../../features/school/utils/school';

const TABS = [
  { id: 'overview', label: 'Overview', Component: SchoolOverviewTab },
  { id: 'members', label: 'Members', Component: SchoolMembersTab },
  { id: 'sections', label: 'Sections', Component: SchoolSectionsTab },
  { id: 'codes', label: 'Invite codes', Component: SchoolCodesTab },
];

function Loading() {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading...
    </div>
  );
}

function SchoolAdmin({ orgId }) {
  const [tab, setTab] = useState('overview');
  const { data, isLoading, error } = useSchoolAdmin(orgId);
  const { Component } = TABS.find(t => t.id === tab);

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-100">
      <div role="tablist" className="flex gap-1 p-2 border-b border-slate-100 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`cursor-pointer whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
              tab === t.id ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-5 sm:p-6">
        {isLoading ? (
          <Loading />
        ) : error ? (
          <p className="text-sm text-red-600">Could not load the school. Please refresh the page.</p>
        ) : (
          <Component key={orgId} data={data} />
        )}
      </div>
    </section>
  );
}

export default function School() {
  const { data: roles, isLoading } = useMyRoles();
  const [selected, setSelected] = useState(null);

  const schools = roles?.adminOrgs ?? [];
  const orgId = selected ?? schools[0]?.id;
  const current = schools.find(s => s.id === orgId);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold text-slate-800">{current?.name ?? 'My school'}</h1>
        {schools.length > 1 && (
          <select value={orgId} onChange={(e) => setSelected(e.target.value)} aria-label="Choose a school"
            className={`${inputClass} w-auto ml-auto`}>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
      </div>
      {isLoading ? (
        <Loading />
      ) : !orgId ? (
        <p className="text-sm text-slate-500">
          {roles?.hasSuspendedSchool
            ? "Your school's Tutre account is suspended. Contact Tutre to reactivate it."
            : 'You are not a school admin. School admins manage members, sections and invite codes here.'}
        </p>
      ) : (
        <SchoolAdmin key={orgId} orgId={orgId} />
      )}
    </div>
  );
}
