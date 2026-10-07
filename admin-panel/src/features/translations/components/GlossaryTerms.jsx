import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useSubjects } from '../../simulations/hooks/useCategories';
import { useDeleteTerm, useGlossary, useSaveTerm } from '../hooks/useTranslations';
import { STATE_STYLES } from '../utils/states';

const inputClass =
  'w-full text-sm p-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-primary-500 outline-none';
const smallButton =
  'cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed';

const EMPTY = { subject_slug: '', term_en: '', term_ur: '', roman_ur: '', notes: '' };

function TermForm({ initial, subjectOptions, onDone }) {
  const [values, setValues] = useState(initial ?? EMPTY);
  const saveTerm = useSaveTerm();
  const set = (key) => (e) => setValues({ ...values, [key]: e.target.value });
  const valid = values.term_en.trim() && values.term_ur.trim();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!valid) return;
    const payload = {
      subject_slug: values.subject_slug || null,
      term_en: values.term_en.trim(),
      term_ur: values.term_ur.trim(),
      roman_ur: values.roman_ur.trim() || null,
      notes: values.notes.trim() || null,
    };
    saveTerm.mutate(
      { id: initial?.id, values: payload },
      {
        onSuccess: () => { toast.success(initial ? 'Term saved.' : 'Term added as a draft.'); setValues(EMPTY); onDone?.(); },
        onError: (err) => toast.error(err.message?.includes('duplicate') ? 'That term already exists for this subject.' : err.message),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-end">
      <select aria-label="Subject" value={values.subject_slug} onChange={set('subject_slug')} className={`${inputClass} sm:col-span-1`}>
        <option value="">All subjects</option>
        {subjectOptions.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
      </select>
      <input aria-label="English term" placeholder="English term" value={values.term_en} onChange={set('term_en')} maxLength={120} className={inputClass} />
      <input aria-label="Urdu term" placeholder="اردو اصطلاح" dir="rtl" lang="ur" value={values.term_ur} onChange={set('term_ur')} maxLength={120} className={`${inputClass} urdu-text`} />
      <input aria-label="Roman Urdu" placeholder="Roman Urdu (optional)" value={values.roman_ur} onChange={set('roman_ur')} maxLength={120} className={inputClass} />
      <input aria-label="Notes" placeholder="Notes, e.g. textbook page" value={values.notes} onChange={set('notes')} maxLength={500} className={inputClass} />
      <div className="flex gap-1">
        <button type="submit" disabled={!valid || saveTerm.isPending} className={`${smallButton} bg-primary-600 text-white border-primary-600 hover:bg-primary-700`}>
          {saveTerm.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          {initial ? 'Save' : 'Add'}
        </button>
        {initial && <button type="button" onClick={onDone} className={smallButton}>Cancel</button>}
      </div>
    </form>
  );
}

// The shared list of technical terms and their agreed Urdu. Verified terms are
// given to translate-content, so AI drafts use the same words as the textbooks.
export default function GlossaryTerms() {
  const { user, studioRole } = useAuth();
  const canVerify = studioRole === 'reviewer' || studioRole === 'platform_admin';
  const { data: terms = [], isLoading } = useGlossary();
  const { data: subjects = [] } = useSubjects(null);
  const saveTerm = useSaveTerm();
  const deleteTerm = useDeleteTerm();
  const [editing, setEditing] = useState(null);
  const [subjectFilter, setSubjectFilter] = useState('all');

  // One entry per subject slug (every class has its own subject rows).
  const subjectOptions = useMemo(() => {
    const bySlug = new Map();
    for (const s of subjects) if (s.slug && !bySlug.has(s.slug)) bySlug.set(s.slug, { slug: s.slug, name: s.name });
    return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [subjects]);
  const subjectName = (slug) => subjectOptions.find(s => s.slug === slug)?.name ?? 'All subjects';

  const visible = subjectFilter === 'all' ? terms : terms.filter(t => (t.subject_slug ?? '') === subjectFilter);

  const setStatus = (term, status) =>
    saveTerm.mutate({ id: term.id, values: { status } }, {
      onSuccess: () => toast.success(status === 'verified' ? 'Term verified. AI drafts will use it.' : 'Term back to draft.'),
      onError: (err) => toast.error(err.message),
    });

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Add the Urdu that Urdu-medium textbooks use for each technical term. Verified terms are used by the AI when it
        drafts translations, so the same term is translated the same way everywhere.
      </p>
      <TermForm subjectOptions={subjectOptions} />

      <div className="flex items-center gap-2">
        <select aria-label="Filter by subject" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}
          className="text-sm p-2 rounded-lg border border-slate-300 bg-slate-50">
          <option value="all">Every term ({terms.length})</option>
          <option value="">All-subject terms</option>
          {subjectOptions.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-slate-500">No terms yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {visible.map(term => editing === term.id ? (
            <li key={term.id} className="py-2">
              <TermForm
                initial={{ id: term.id, subject_slug: term.subject_slug ?? '', term_en: term.term_en, term_ur: term.term_ur, roman_ur: term.roman_ur ?? '', notes: term.notes ?? '' }}
                subjectOptions={subjectOptions}
                onDone={() => setEditing(null)}
              />
            </li>
          ) : (
            <li key={term.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
              <span className="text-sm font-bold text-slate-800">{term.term_en}</span>
              <span dir="rtl" lang="ur" className="urdu-text text-base text-slate-800">{term.term_ur}</span>
              {term.roman_ur && <span className="text-xs text-slate-500 italic">{term.roman_ur}</span>}
              <span className="text-xs text-slate-400">{subjectName(term.subject_slug)}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${STATE_STYLES[term.status]}`}>{term.status}</span>
              {term.notes && <span className="text-xs text-slate-400">{term.notes}</span>}
              <span className="ms-auto flex gap-1">
                {(canVerify || term.status === 'draft') && (
                  <button type="button" className={smallButton} onClick={() => setEditing(term.id)}>
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
                {canVerify && term.status === 'draft' && (
                  <button type="button" className={`${smallButton} border-emerald-200 text-emerald-700`} onClick={() => setStatus(term, 'verified')}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verify
                  </button>
                )}
                {canVerify && term.status === 'verified' && (
                  <button type="button" className={smallButton} onClick={() => setStatus(term, 'draft')}>
                    <RotateCcw className="w-3.5 h-3.5" /> Back to draft
                  </button>
                )}
                {(canVerify || (term.status === 'draft' && term.edited_by === user?.id)) && (
                  <button type="button" className="cursor-pointer inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50"
                    onClick={() => deleteTerm.mutate(term.id, {
                      onSuccess: () => toast.success('Term deleted.'),
                      onError: (err) => toast.error(err.message),
                    })}>
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
