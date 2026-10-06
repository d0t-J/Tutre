import { Link } from 'react-router-dom';
import { KeyRound, School, Users } from 'lucide-react';

const ROLE_LABELS = {
  org_admin: 'School admin',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent',
};

function SectionRow({ section }) {
  const details = [section.className, section.academicYear].filter(Boolean).join(' · ');
  return (
    <li className="flex items-start gap-3 py-2.5">
      <Users className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-800">
          {section.name}
          {details && <span className="ml-2 text-xs font-medium text-slate-500">{details}</span>}
          {section.role === 'teacher' && (
            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-primary-600">You teach</span>
          )}
        </p>
        {section.teachers.length > 0 && (
          <p className="text-xs text-slate-500">
            {section.role === 'teacher' ? 'Also taught by ' : 'Taught by '}
            {section.teachers.join(', ')}
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
  if (schools.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-slate-500">
          You are not part of a school on Tutre yet. You can still use every published simulation.
        </p>
        <JoinLink label="Join with a code from your school" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {schools.map(school => (
        <div key={school.id}>
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-primary-600" />
            <p className="text-sm font-extrabold text-slate-800">{school.name}</p>
            {school.status !== 'active' && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Suspended</span>
            )}
          </div>
          <p className="ml-6 text-xs text-slate-500">
            {school.roles.map(role => ROLE_LABELS[role] ?? role).join(', ')}
          </p>
          {school.sections.length > 0 ? (
            <ul className="ml-6 mt-1 divide-y divide-slate-100">
              {school.sections.map(section => (
                <SectionRow key={`${section.id}-${section.role}`} section={section} />
              ))}
            </ul>
          ) : (
            <p className="ml-6 mt-1 text-xs text-slate-400">No sections yet.</p>
          )}
        </div>
      ))}
      <JoinLink label="Join another class with a code" />
    </div>
  );
}
