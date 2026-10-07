import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Sparkles, Square } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useClasses, useSubjects, useChapters } from '../../simulations/hooks/useCategories';
import { draftWithAI, rowState, useTranslationOverview } from '../hooks/useTranslations';
import TranslationRow from './TranslationRow';
import { STATE_STYLES } from '../utils/states';

const selectClass =
  'text-sm p-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-primary-500 outline-none';

const FIELDS = [
  { value: 'name', label: 'Names' },
  { value: 'description', label: 'Descriptions' },
  { value: 'study_guide', label: 'Study guides' },
  { value: '', label: 'All fields' },
];
const STATES = ['missing', 'draft', 'verified', 'outdated'];

export default function CurriculumTranslations() {
  const { user, studioRole } = useAuth();
  const canVerify = studioRole === 'reviewer' || studioRole === 'platform_admin';
  const queryClient = useQueryClient();

  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [field, setField] = useState('name');
  const [stateFilter, setStateFilter] = useState('');
  // ?topic=<id> (from a Saved Simulations card): every text of one topic.
  const [searchParams, setSearchParams] = useSearchParams();
  const topicId = searchParams.get('topic');
  const [bulk, setBulk] = useState(null); // { done, total }
  const stopRef = useRef(false);

  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects(classId || null);
  const { data: chapters = [] } = useChapters(subjectId || null);
  const { data: rows = [], isLoading, error } = useTranslationOverview({ classId, subjectId, chapterId, field, topicId });

  const counts = useMemo(() => {
    const c = { missing: 0, draft: 0, verified: 0, outdated: 0 };
    for (const row of rows) c[rowState(row)] += 1;
    return c;
  }, [rows]);
  const visible = stateFilter ? rows.filter(r => rowState(r) === stateFilter) : rows;
  const missing = rows.filter(r => rowState(r) === 'missing');

  // Drafts every missing row in view, one request at a time, until done, stopped
  // or refused (for example by the daily limit).
  const draftAllMissing = async () => {
    stopRef.current = false;
    setBulk({ done: 0, total: missing.length });
    let done = 0;
    for (const row of missing) {
      if (stopRef.current) break;
      try {
        await draftWithAI(row);
      } catch (err) {
        toast.error(`Stopped after ${done} of ${missing.length}: ${err.message}`);
        break;
      }
      done += 1;
      setBulk({ done, total: missing.length });
    }
    setBulk(null);
    queryClient.invalidateQueries({ queryKey: ['translation-overview'] });
    if (done > 0) toast.success(`${done} AI drafts ready for review.`);
  };

  return (
    <div className="space-y-4">
      {topicId ? (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-primary-50 border border-primary-100 text-sm">
          <span className="text-slate-600">Every text of one topic:</span>
          <span className="font-bold text-slate-800">{rows.find(r => r.field === 'name')?.english ?? '…'}</span>
          <button type="button" onClick={() => setSearchParams({})}
            className="cursor-pointer ms-auto text-xs font-bold text-primary-700 hover:underline">
            Show all topics
          </button>
        </div>
      ) : (
      <div className="flex flex-wrap items-end gap-2">
        <select aria-label="Class" value={classId} className={selectClass}
          onChange={(e) => { setClassId(e.target.value); setSubjectId(''); setChapterId(''); }}>
          <option value="">All classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select aria-label="Subject" value={subjectId} disabled={!classId} className={selectClass}
          onChange={(e) => { setSubjectId(e.target.value); setChapterId(''); }}>
          <option value="">All subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select aria-label="Chapter" value={chapterId} disabled={!subjectId} className={selectClass}
          onChange={(e) => setChapterId(e.target.value)}>
          <option value="">All chapters</option>
          {chapters.map(ch => <option key={ch.id} value={ch.id}>{ch.chapter_no ? `${ch.chapter_no}. ` : ''}{ch.name}</option>)}
        </select>
        <select aria-label="Field" value={field} className={selectClass} onChange={(e) => setField(e.target.value)}>
          {FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setStateFilter('')}
          className={`cursor-pointer px-2.5 py-1 rounded-lg text-xs font-bold ${stateFilter === '' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
          All {rows.length}
        </button>
        {STATES.map(s => (
          <button key={s} type="button" onClick={() => setStateFilter(s)}
            className={`cursor-pointer px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${stateFilter === s ? 'ring-2 ring-slate-400' : ''} ${STATE_STYLES[s]}`}>
            {s} {counts[s]}
          </button>
        ))}
        <span className="ms-auto">
          {bulk ? (
            <button type="button" onClick={() => { stopRef.current = true; }}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> {bulk.done} / {bulk.total} <Square className="w-3 h-3" /> Stop
            </button>
          ) : (
            <button type="button" onClick={draftAllMissing} disabled={missing.length === 0}
              title="Asks the AI for a draft of every missing item shown. Each one uses one of your 300 daily translation requests."
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed">
              <Sparkles className="w-3.5 h-3.5" /> Draft {missing.length} missing with AI
            </button>
          )}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
      ) : error ? (
        <p className="text-sm text-red-600">Could not load translations. Please refresh the page.</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-slate-500">Nothing here.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map(row => (
            <TranslationRow
              key={`${row.entity_type}:${row.entity_id}:${row.field}:${row.updated_at ?? 'none'}`}
              row={row}
              canVerify={canVerify}
              userId={user?.id}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
