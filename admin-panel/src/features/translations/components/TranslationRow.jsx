import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Eye, Loader2, RotateCcw, Save, Sparkles, Trash2 } from 'lucide-react';
import { sanitizeHTML } from '../../../utils/sanitizeHTML';
import {
  rowState, useDeleteTranslation, useDraftWithAI, useSaveTranslation, useSetTranslationStatus,
} from '../hooks/useTranslations';
import { STATE_STYLES } from '../utils/states';

const TYPE_LABELS = { class: 'Class', subject: 'Subject', chapter: 'Chapter', topic: 'Topic' };
const FIELD_LABELS = { name: 'name', description: 'description', study_guide: 'study guide' };


const smallButton =
  'cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

// One translatable field: its English source, the Urdu text, and the review
// actions the signed-in Studio role may use. The database enforces the same rules.
export default function TranslationRow({ row, canVerify, userId }) {
  const [text, setText] = useState(row.urdu ?? '');
  const [preview, setPreview] = useState(false);
  const save = useSaveTranslation();
  const setStatus = useSetTranslationStatus();
  const remove = useDeleteTranslation();
  const draft = useDraftWithAI();

  const state = rowState(row);
  const isHtml = row.field !== 'name';
  const isDirty = text.trim() !== (row.urdu ?? '').trim();
  const verified = row.status === 'verified';
  const lockedForAuthor = verified && !canVerify;
  const busy = save.isPending || setStatus.isPending || remove.isPending || draft.isPending;
  const canDelete = row.translation_id && (canVerify || (row.status === 'draft' && row.edited_by === userId));

  const onError = (fallback) => (err) => toast.error(err.message || fallback);

  const handleSave = (status) => {
    if (!text.trim()) return;
    save.mutate(
      { row, text: text.trim(), status },
      {
        onSuccess: () => toast.success(status === 'verified' ? 'Saved and verified. Students see it now.' : 'Draft saved.'),
        onError: onError('Could not save the translation.'),
      }
    );
  };

  const handleDraft = () => {
    draft.mutate(row, {
      onSuccess: (data) => { setText(data.text); toast.success('AI draft ready. Check it, then save or verify.'); },
      onError: onError('Could not draft a translation.'),
    });
  };

  return (
    <li className="p-3 sm:p-4 rounded-xl border border-slate-200 bg-white space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {TYPE_LABELS[row.entity_type]} {FIELD_LABELS[row.field]}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${STATE_STYLES[state]}`}>
          {state}
        </span>
        {row.source === 'ai' && row.status === 'draft' && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600">AI draft</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="min-w-0">
          {isHtml ? (
            <details className="text-sm text-slate-700">
              <summary className="cursor-pointer text-xs font-bold text-slate-500">English (click to show)</summary>
              <div className="prose prose-sm max-w-none mt-2 max-h-80 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(row.english) }} />
            </details>
          ) : (
            <p className="text-sm font-medium text-slate-800">{row.english}</p>
          )}
        </div>

        <div className="min-w-0 space-y-2">
          {preview && isHtml ? (
            <div dir="rtl" lang="ur" className="urdu-text prose prose-sm max-w-none max-h-80 overflow-y-auto p-2 rounded-lg border border-slate-200"
              dangerouslySetInnerHTML={{ __html: sanitizeHTML(text) }} />
          ) : (
            <textarea
              dir="rtl"
              lang="ur"
              rows={isHtml ? 8 : 1}
              value={text}
              disabled={lockedForAuthor || busy}
              onChange={(e) => setText(e.target.value)}
              placeholder="اردو ترجمہ"
              title={lockedForAuthor ? 'Only a reviewer can change a verified translation.' : undefined}
              className={`urdu-text w-full text-sm p-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-100 outline-none ${isHtml ? 'font-mono text-xs' : ''}`}
            />
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            {!verified && (
              <button type="button" onClick={handleDraft} disabled={busy} className={smallButton}
                title="Ask the AI for a draft. Uses one of your 300 daily translation requests.">
                {draft.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Draft with AI
              </button>
            )}
            {isHtml && (
              <button type="button" onClick={() => setPreview(p => !p)} className={smallButton}>
                <Eye className="w-3.5 h-3.5" /> {preview ? 'Edit HTML' : 'Preview'}
              </button>
            )}
            {!lockedForAuthor && (
              <button type="button" onClick={() => handleSave(verified ? 'verified' : 'draft')}
                disabled={busy || !isDirty || !text.trim()} className={smallButton}>
                <Save className="w-3.5 h-3.5" /> {verified ? 'Save' : 'Save draft'}
              </button>
            )}
            {canVerify && !verified && (
              <button type="button" onClick={() => handleSave('verified')} disabled={busy || !text.trim()}
                className={`${smallButton} border-emerald-200 text-emerald-700 hover:bg-emerald-50`}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Verify
              </button>
            )}
            {canVerify && verified && row.outdated && (
              <button type="button" onClick={() => handleSave('verified')} disabled={busy || !text.trim()}
                className={`${smallButton} border-emerald-200 text-emerald-700 hover:bg-emerald-50`}
                title="The English changed after this was translated. Check the Urdu, then confirm it.">
                <CheckCircle2 className="w-3.5 h-3.5" /> Confirm still correct
              </button>
            )}
            {canVerify && verified && (
              <button type="button" disabled={busy} className={smallButton}
                onClick={() => setStatus.mutate({ id: row.translation_id, status: 'draft' }, {
                  onSuccess: () => toast.success('Back to draft. Students see the English now.'),
                  onError: onError('Could not change the status.'),
                })}>
                <RotateCcw className="w-3.5 h-3.5" /> Back to draft
              </button>
            )}
            {canDelete && (
              <button type="button" disabled={busy}
                className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                onClick={() => remove.mutate(row.translation_id, {
                  onSuccess: () => { setText(''); toast.success('Translation deleted.'); },
                  onError: onError('Could not delete the translation.'),
                })}>
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
