import { useState } from 'react';
import { toast } from 'sonner';
import { Archive, ArchiveRestore, Loader2, Pencil, Plus, UserMinus, UserPlus } from 'lucide-react';
import { useClassOptions } from '../../profile';
import { useAddSectionMember, useCreateSection, useRemoveSectionMember, useUpdateSection } from '../hooks/useSchoolActions';
import {
  inputClass, labelClass, primaryButtonClass, secondaryButtonClass, dangerButtonClass,
} from '../utils/school';

const YEAR_PATTERN = /^[0-9]{4}(-[0-9]{2,4})?$/;

// Name, class and academic year: used to create a section and to edit one.
function SectionFields({ idPrefix, values, onChange, classes }) {
  return (
    <>
      <div className="min-w-32 flex-1">
        <label className={labelClass} htmlFor={`${idPrefix}-name`}>Name</label>
        <input id={`${idPrefix}-name`} type="text" maxLength={60} placeholder="9-A" required
          value={values.name} onChange={(e) => onChange({ ...values, name: e.target.value })} className={inputClass} />
      </div>
      <div className="min-w-32">
        <label className={labelClass} htmlFor={`${idPrefix}-class`}>Class</label>
        <select id={`${idPrefix}-class`} value={values.classId}
          onChange={(e) => onChange({ ...values, classId: e.target.value })} className={inputClass}>
          <option value="">Not set</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="w-32">
        <label className={labelClass} htmlFor={`${idPrefix}-year`}>Year</label>
        <input id={`${idPrefix}-year`} type="text" maxLength={9} placeholder="2026-27"
          value={values.academicYear} onChange={(e) => onChange({ ...values, academicYear: e.target.value })} className={inputClass} />
      </div>
    </>
  );
}

const validate = (values) => {
  if (!values.name.trim()) return 'Enter a section name.';
  if (values.academicYear.trim() && !YEAR_PATTERN.test(values.academicYear.trim())) return 'Write the year like 2026 or 2026-27.';
  return null;
};

function CreateSectionForm({ orgId, classes }) {
  const empty = { name: '', classId: '', academicYear: '' };
  const [values, setValues] = useState(empty);
  const createSection = useCreateSection();
  const error = values.name || values.academicYear ? validate(values) : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate(values)) return;
    createSection.mutate(
      { orgId, name: values.name.trim(), classId: values.classId, academicYear: values.academicYear.trim() },
      {
        onSuccess: () => { toast.success(`Section ${values.name.trim()} created.`); setValues(empty); },
        onError: (err) => toast.error(err.message || 'Could not create the section.'),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-wrap items-end gap-3">
        <SectionFields idPrefix="new-section" values={values} onChange={setValues} classes={classes} />
        <button type="submit" disabled={!!validate(values) || createSection.isPending} className={primaryButtonClass}>
          {createSection.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add section
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </form>
  );
}

function AddMemberForm({ section, candidates, role }) {
  const [userId, setUserId] = useState('');
  const addMember = useAddSectionMember();
  const label = role === 'teacher' ? 'teacher' : 'student';

  if (candidates.length === 0) return null;

  const handleAdd = () => {
    const person = candidates.find(c => c.userId === userId);
    addMember.mutate(
      { sectionId: section.id, userId, role },
      {
        onSuccess: () => { toast.success(`${person?.name ?? 'They'} added to ${section.name}.`); setUserId(''); },
        onError: (err) => toast.error(err.message || 'Could not add them.'),
      }
    );
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      <select value={userId} onChange={(e) => setUserId(e.target.value)} aria-label={`Add a ${label}`}
        className={`${inputClass} max-w-64 py-1.5`}>
        <option value="">Add a {label}...</option>
        {candidates.map(c => <option key={c.userId} value={c.userId}>{c.name}</option>)}
      </select>
      <button type="button" onClick={handleAdd} disabled={!userId || addMember.isPending} className={secondaryButtonClass}>
        <UserPlus className="w-3.5 h-3.5" /> Add
      </button>
    </div>
  );
}

function SectionCard({ section, members, classes }) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({
    name: section.name, classId: section.classId ?? '', academicYear: section.academicYear ?? '',
  });
  const updateSection = useUpdateSection();
  const removeMember = useRemoveSectionMember();

  const details = [section.className, section.academicYear].filter(Boolean).join(' · ');

  const save = (changes, message, done) => {
    updateSection.mutate(
      { sectionId: section.id, changes },
      {
        onSuccess: () => { toast.success(message); done?.(); },
        onError: (err) => toast.error(err.message || 'Could not update the section.'),
      }
    );
  };

  const handleEdit = (e) => {
    e.preventDefault();
    if (validate(values)) return;
    save(
      { name: values.name.trim(), class_id: values.classId || null, academic_year: values.academicYear.trim() || null },
      'Section saved.',
      () => setEditing(false)
    );
  };

  const handleRemove = (member) => {
    removeMember.mutate(
      { sectionId: section.id, userId: member.userId, role: member.role },
      {
        onSuccess: () => toast.success(`${member.name} taken off ${section.name}.`),
        onError: (err) => toast.error(err.message || 'Could not remove them.'),
      }
    );
  };

  // Active school members in this role who are not in the section yet.
  const candidates = (role) =>
    members.filter(m => m.role === role && m.status === 'active'
      && !section.members.some(sm => sm.userId === m.userId && sm.role === role));

  if (section.archived) {
    return (
      <li className="flex items-center gap-3 py-2.5">
        <span className="text-sm font-medium text-slate-500">{section.name}</span>
        {details && <span className="text-xs text-slate-400">{details}</span>}
        <button type="button" disabled={updateSection.isPending} className={`ml-auto ${secondaryButtonClass}`}
          onClick={() => save({ archived: false }, `${section.name} is active again.`)}>
          <ArchiveRestore className="w-3.5 h-3.5" /> Unarchive
        </button>
      </li>
    );
  }

  return (
    <li className="p-4 rounded-xl border border-slate-200 space-y-3">
      {editing ? (
        <form onSubmit={handleEdit}>
          <div className="flex flex-wrap items-end gap-3">
            <SectionFields idPrefix={`section-${section.id}`} values={values} onChange={setValues} classes={classes} />
            <button type="submit" disabled={!!validate(values) || updateSection.isPending} className={primaryButtonClass}>Save</button>
            <button type="button" onClick={() => setEditing(false)} className={secondaryButtonClass}>Cancel</button>
          </div>
          {validate(values) && <p className="mt-1 text-xs text-red-600">{validate(values)}</p>}
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-base font-extrabold text-slate-800">{section.name}</h4>
          {details && <span className="text-xs text-slate-500">{details}</span>}
          <span className="ml-auto flex gap-1">
            <button type="button" onClick={() => setEditing(true)} className={secondaryButtonClass}>
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button type="button" disabled={updateSection.isPending} className={secondaryButtonClass}
              onClick={() => save({ archived: true }, `${section.name} archived.`)}>
              <Archive className="w-3.5 h-3.5" /> Archive
            </button>
          </span>
        </div>
      )}

      {['teacher', 'student'].map(role => {
        const inRole = section.members.filter(m => m.role === role);
        return (
          <div key={role}>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {role === 'teacher' ? 'Teachers' : 'Students'} ({inRole.length})
            </p>
            {inRole.length > 0 && (
              <ul className="divide-y divide-slate-100">
                {inRole.map(member => (
                  <li key={member.userId} className="flex items-center gap-2 py-1.5">
                    <span className="text-sm text-slate-800">{member.name}</span>
                    <button type="button" onClick={() => handleRemove(member)} disabled={removeMember.isPending}
                      className={`ml-auto ${dangerButtonClass}`} title={`Take ${member.name} off ${section.name}`}>
                      <UserMinus className="w-3.5 h-3.5" /> Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <AddMemberForm section={section} candidates={candidates(role)} role={role} />
          </div>
        );
      })}
    </li>
  );
}

export default function SchoolSectionsTab({ data }) {
  const { data: classes = [] } = useClassOptions();
  const active = data.sections.filter(s => !s.archived);
  const archived = data.sections.filter(s => s.archived);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-2">New section</h3>
        <CreateSectionForm orgId={data.school.id} classes={classes} />
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-2">Sections ({active.length})</h3>
        {active.length === 0 ? (
          <p className="text-xs text-slate-400">No sections yet.</p>
        ) : (
          <ul className="space-y-3">
            {active.map(section => (
              <SectionCard key={section.id} section={section} members={data.members} classes={classes} />
            ))}
          </ul>
        )}
      </div>

      {archived.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-bold text-slate-500">Archived ({archived.length})</summary>
          <p className="text-xs text-slate-400 mt-1">
            Archived sections are no longer shown to their teachers and students; their member lists are kept. Codes for an archived section still work until they expire, so revoke any you no longer need.
          </p>
          <ul className="divide-y divide-slate-100">
            {archived.map(section => (
              <SectionCard key={section.id} section={section} members={data.members} classes={classes} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
