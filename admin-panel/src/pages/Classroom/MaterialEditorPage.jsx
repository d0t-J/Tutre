import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import JoditEditor from 'jodit-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FileUp, Loader2, Save, Sparkles, Wand2 } from 'lucide-react';
import CurriculumPicker from '../../features/classroom/components/CurriculumPicker';
import { SchoolChooser } from '../../features/classroom/components/Libraries';
import { useMaterial, useSaveMaterial } from '../../features/classroom/hooks/useMaterials';
import { draftNotes, generateSimulation } from '../../features/classroom/hooks/useMaterialAI';
import { extractDescription } from '../../features/simulations/utils/extractDescription';
import { useClasses } from '../../features/simulations/hooks/useClassQueries';
import { useSubjects } from '../../features/simulations/hooks/useSubjectQueries';
import ResponsiveSimulationFrame from '../../components/common/ResponsiveSimulationFrame';
import { sanitizeHTML } from '../../utils/sanitizeHTML';
import { translateError } from '../../i18n/errors';
import { useAuth } from '../../context/AuthContext';
import {
  inputClass, labelClass, primaryButtonClass, secondaryButtonClass,
} from '../../features/school/utils/school';

const MAX_UPLOAD = 2 * 1024 * 1024;
const EMPTY_PLACE = { classId: null, subjectId: null, chapterId: null, topicId: null };

const placeOf = (material) => material ? {
  classId: material.chapters?.subjects?.classes?.id ?? null,
  subjectId: material.chapters?.subject_id ?? null,
  chapterId: material.chapter_id,
  topicId: material.topic_id,
} : EMPTY_PLACE;

// Rich text for notes and for a simulation's description. Whatever goes in is
// cleaned first: notes copied from someone else are not trusted.
function RichText({ value, onChange, language, placeholder, minHeight = 320, readOnly = false }) {
  const config = useMemo(() => ({
    readonly: readOnly,
    placeholder,
    direction: language === 'ur' ? 'rtl' : 'ltr',
    toolbarSticky: false,
    showCharsCounter: false,
    showWordsCounter: false,
    showXPathInStatusbar: false,
    minHeight,
  }), [readOnly, placeholder, language, minHeight]);
  return <JoditEditor value={sanitizeHTML(value)} config={config} onBlur={(html) => onChange(sanitizeHTML(html))} />;
}

function SimulationPreview({ html, title }) {
  const { t } = useTranslation('classroom');
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  if (!html) {
    return (
      <div className="flex-1 min-h-80 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-400 p-6 text-center">
        {t('editor.noPreview')}
      </div>
    );
  }
  // Untrusted HTML: only ever in the sandboxed frame (allow-scripts only).
  return (
    <ResponsiveSimulationFrame
      key={html.length}
      srcDoc={html}
      title={title || t('kind.simulation')}
      iframeRef={iframeRef}
      iframeLoading={loading}
      setIframeLoading={setLoading}
      containerClassName="flex flex-col w-full aspect-[4/3] min-h-0 relative items-center justify-center overflow-hidden"
    />
  );
}

function MaterialEditor({ material, kind }) {
  const { t } = useTranslation('classroom');
  const navigate = useNavigate();
  const { user, staffOrgs } = useAuth();
  const readOnly = !!material && material.owner_id !== user?.id;

  const [orgId, setOrgId] = useState(material?.org_id ?? staffOrgs[0]?.id ?? '');
  const [place, setPlace] = useState(placeOf(material));
  const [title, setTitle] = useState(material?.title ?? '');
  const [summary, setSummary] = useState(material?.summary ?? '');
  const [content, setContent] = useState(material?.content ?? '');
  const [language, setLanguage] = useState(material?.language ?? 'en');
  const [visibility, setVisibility] = useState(material?.visibility ?? 'private');
  const [request, setRequest] = useState('');
  const [dimension, setDimension] = useState('2D');
  const [working, setWorking] = useState(false);
  const save = useSaveMaterial();

  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects(place.classId || undefined);
  const className = classes.find(c => c.id === place.classId)?.name ?? '';
  const subjectName = subjects.find(s => s.id === place.subjectId)?.name ?? '';

  const problem = !orgId ? 'editor.needSchool'
    : !place.chapterId ? 'editor.needChapter'
    : title.trim().length < 2 ? 'editor.needTitle'
    : !content.trim() ? (kind === 'simulation' ? 'editor.needSimulation' : 'editor.needNotes')
    : null;

  const handleSave = () => {
    if (problem) { toast.error(t(problem)); return; }
    save.mutate(
      {
        id: material?.id,
        values: {
          org_id: orgId, kind, chapter_id: place.chapterId, topic_id: place.topicId || null,
          title: title.trim(), summary: sanitizeHTML(summary), language, visibility,
          // Simulations stay as written (they run sandboxed); notes are cleaned.
          content: kind === 'notes' ? sanitizeHTML(content) : content,
        },
      },
      {
        onSuccess: (id) => {
          toast.success(t('editor.saved'));
          if (!material) navigate(`/classroom/materials/${id}`, { replace: true });
        },
        onError: (err) => toast.error(translateError(err, t, 'editor.saveFailed')),
      }
    );
  };

  const runSimulationAI = async () => {
    if (!request.trim()) { toast.error(t('ai.needRequest')); return; }
    if (!title.trim()) { toast.error(t('editor.needTitle')); return; }
    setWorking(true);
    try {
      const result = await generateSimulation({
        dimension, subject: subjectName, className, topic: title.trim(),
        details: content ? '' : request, request: content ? request : '', existingCode: content || undefined,
      });
      setContent(result.html);
      if (result.description) setSummary(result.description);
      setRequest('');
      toast.success(t(content ? 'ai.updated' : 'ai.created'));
    } catch (err) {
      toast.error(err.message || t('ai.failed'));
    } finally {
      setWorking(false);
    }
  };

  const runNotesAI = async () => {
    if (!title.trim()) { toast.error(t('editor.needTitle')); return; }
    setWorking(true);
    try {
      const html = await draftNotes({ topic: title.trim(), details: request || summary || title, onUpdate: setContent });
      setContent(html);
      toast.success(t('ai.drafted'));
    } catch (err) {
      toast.error(err.message || t('ai.failed'));
    } finally {
      setWorking(false);
    }
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/\.html?$/i.test(file.name)) { toast.error(t('upload.notHtml')); return; }
    if (file.size > MAX_UPLOAD) { toast.error(t('upload.tooBig')); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      if (!/<[a-z][\s\S]*>/i.test(text)) { toast.error(t('upload.notHtml')); return; }
      const { cleanedHtml, description } = extractDescription(text);
      setContent(cleanedHtml);
      if (description) setSummary(description);
      toast.success(t('upload.done', { name: file.name }));
    };
    reader.onerror = () => toast.error(t('upload.failed'));
    reader.readAsText(file);
  };

  if (readOnly) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">{t('editor.readOnly')}</p>
        <h2 className="text-xl font-extrabold text-slate-800"><bdi>{material.title}</bdi></h2>
        {kind === 'simulation' && <SimulationPreview html={material.content} title={material.title} />}
        <div dir={material.language === 'ur' ? 'rtl' : 'ltr'} className="prose prose-slate max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(kind === 'notes' ? material.content : material.summary) }} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <SchoolChooser value={orgId} onChange={setOrgId} />
        <CurriculumPicker value={place} onChange={setPlace} />
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-60">
            <label htmlFor="material-title" className={labelClass}>{t('editor.title')}</label>
            <input id="material-title" type="text" dir="auto" maxLength={120} value={title}
              onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </div>
          <div className="w-40">
            <label htmlFor="material-language" className={labelClass}>{t('editor.language')}</label>
            <select id="material-language" value={language} onChange={(e) => setLanguage(e.target.value)} className={inputClass}>
              <option value="en">English</option>
              <option value="ur">اردو</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input type="checkbox" checked={visibility === 'school'} className="w-4 h-4 accent-primary-600"
            onChange={(e) => setVisibility(e.target.checked ? 'school' : 'private')} />
          {t('editor.shareWithStaff')}
        </label>
      </section>

      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary-600" />
          {kind === 'simulation' ? (content ? t('ai.changeTitle') : t('ai.createTitle')) : t('ai.notesTitle')}
        </h3>
        <textarea rows={3} dir="auto" value={request} onChange={(e) => setRequest(e.target.value)}
          placeholder={kind === 'simulation'
            ? (content ? t('ai.changePlaceholder') : t('ai.createPlaceholder'))
            : t('ai.notesPlaceholder')}
          aria-label={t('ai.requestLabel')} className={inputClass} />
        <div className="flex flex-wrap items-center gap-2">
          {kind === 'simulation' && !content && (
            <select value={dimension} onChange={(e) => setDimension(e.target.value)} aria-label={t('ai.dimension')} className={`${inputClass} w-auto`}>
              <option value="2D">2D</option>
              <option value="3D">3D</option>
            </select>
          )}
          <button type="button" disabled={working} onClick={kind === 'simulation' ? runSimulationAI : runNotesAI} className={primaryButtonClass}>
            {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {kind === 'simulation' ? (content ? t('ai.change') : t('ai.create')) : t('ai.draft')}
          </button>
          {kind === 'simulation' && (
            <label className={`${secondaryButtonClass} text-sm`}>
              <FileUp className="w-4 h-4" /> {t('upload.button')}
              <input type="file" accept=".html,.htm,text/html" className="sr-only" onChange={handleUpload} />
            </label>
          )}
          <span className="text-xs text-slate-400">{t(kind === 'simulation' ? 'ai.simulationLimit' : 'ai.notesLimit')}</span>
        </div>
      </section>

      {kind === 'simulation' ? (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
          <div className="xl:col-span-3">
            {working && !content ? (
              <div className="min-h-80 flex items-center justify-center text-sm text-slate-500 gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> {t('ai.working')}
              </div>
            ) : (
              <SimulationPreview html={content} title={title} />
            )}
          </div>
          <div className="xl:col-span-2 space-y-2">
            <p className={labelClass}>{t('editor.description')}</p>
            <p className="text-xs text-slate-400">{t('editor.descriptionNote')}</p>
            <RichText value={summary} onChange={setSummary} language={language} minHeight={260}
              placeholder={t('editor.descriptionPlaceholder')} />
          </div>
        </div>
      ) : working ? (
        <div dir={language === 'ur' ? 'rtl' : 'ltr'} className="prose prose-slate max-w-none bg-white rounded-2xl border border-slate-100 p-6"
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(content) }} />
      ) : (
        <RichText value={content} onChange={setContent} language={language} placeholder={t('editor.notesPlaceholder')} />
      )}

      <div className="flex flex-wrap items-center gap-3 sticky bottom-0 bg-[#FDFBF7] py-3">
        <button type="button" onClick={handleSave} disabled={save.isPending || working} className={primaryButtonClass}>
          {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {t('editor.save')}
        </button>
        {material && <span className="text-xs text-slate-400">{t('editor.version', { version: material.version })}</span>}
        {problem && <span className="text-xs text-slate-400">{t(problem)}</span>}
      </div>
    </div>
  );
}

export default function MaterialEditorPage() {
  const { t } = useTranslation('classroom');
  const { user } = useAuth();
  const { id } = useParams();
  const [params] = useSearchParams();
  const { data: material, isLoading, error } = useMaterial(id);
  const kind = material?.kind ?? (params.get('kind') === 'notes' ? 'notes' : 'simulation');
  const mode = !id ? 'new' : material && material.owner_id !== user?.id ? 'view' : 'edit';

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-4 sm:p-0 space-y-4">
        {mode === 'view' ? (
          <button type="button" onClick={() => window.history.back()} className="cursor-pointer inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" /> {t('common:actions.back')}
          </button>
        ) : (
          <Link to="/classroom?tab=materials" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" /> {t('editor.back')}
          </Link>
        )}
        <h1 className="text-2xl font-extrabold text-slate-800">{t(`editor.${mode}.${kind}`)}</h1>
        {id && isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        ) : id && (error || !material) ? (
          <p className="text-sm text-slate-500">{t('editor.notFound')}</p>
        ) : (
          <MaterialEditor key={id ?? `new-${kind}`} material={material} kind={kind} />
        )}
      </div>
    </div>
  );
}
