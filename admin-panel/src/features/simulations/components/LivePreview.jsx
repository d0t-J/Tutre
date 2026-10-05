import { PlayCircle, Save, CheckCircle2, PlusCircle, Send, Globe, Undo2 } from 'lucide-react';
import PreviewContent from './LivePreview/PreviewContent';
import StatusBadge from './StatusBadge';
import { useSimulation } from '../context/SimulationContext';
import { useAuth } from '../../../context/AuthContext';
import { canPublish } from '../utils/simulationStatus';

const STATUS_BUTTON = 'cursor-pointer justify-center py-1.5 px-3 rounded-md text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

export default function LivePreview({ headerControls }) {
  const { 
    generatedHtml, 
    generatedDescription, 
    isSaving, 
    saveSuccess, 
    handleSave, 
    isLoadedFromSaved, 
    loadedSimId, 
    isDirty, 
    handleCreateNew,
    isGenerating,
    loadedStatus,
    changeStatus,
    isChangingStatus
  } = useSimulation();
  const { studioRole } = useAuth();
  const reviewer = canPublish(studioRole);
  // Status actions act on the saved version, so they wait until changes are saved.
  const statusDisabled = isChangingStatus || isSaving || isDirty;
  // Authors work on drafts; a published or archived simulation is a reviewer's to
  // change (the database refuses it too).
  const lockedForAuthor = !reviewer && (loadedStatus === 'published' || loadedStatus === 'archived');

  return (
    <div className={`bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col h-full ${!generatedHtml ? 'aspect-square sm:aspect-auto sm:min-h-100' : 'min-h-100'}`}>
      <div className="flex flex-wrap items-start sm:items-center justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5 whitespace-nowrap">
            <PlayCircle className="w-4 h-4 text-primary-600 shrink-0" />
            Live Preview
          </h2>
          {headerControls}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {loadedSimId && loadedStatus && <StatusBadge status={loadedStatus} />}

          {loadedSimId && loadedStatus === 'draft' && !reviewer && (
            <button onClick={() => changeStatus('in_review')} disabled={statusDisabled}
              className={`${STATUS_BUTTON} bg-amber-100 text-amber-800 hover:bg-amber-200`}>
              <Send className="w-3.5 h-3.5 shrink-0" /> Submit for review
            </button>
          )}
          {loadedSimId && loadedStatus === 'in_review' && !reviewer && (
            <button onClick={() => changeStatus('draft')} disabled={statusDisabled}
              className={`${STATUS_BUTTON} bg-slate-100 text-slate-700 hover:bg-slate-200`}>
              <Undo2 className="w-3.5 h-3.5 shrink-0" /> Back to draft
            </button>
          )}
          {loadedSimId && loadedStatus && loadedStatus !== 'published' && reviewer && (
            <button onClick={() => changeStatus('published')} disabled={statusDisabled}
              title={isDirty ? 'Save your changes first' : 'Make this simulation visible to students'}
              className={`${STATUS_BUTTON} bg-emerald-600 text-white hover:bg-emerald-700`}>
              <Globe className="w-3.5 h-3.5 shrink-0" /> Publish
            </button>
          )}
          {loadedSimId && loadedStatus === 'published' && reviewer && (
            <button onClick={() => changeStatus('draft')} disabled={statusDisabled}
              title={isDirty ? 'Save your changes first' : 'Hide this simulation from students'}
              className={`${STATUS_BUTTON} bg-slate-100 text-slate-700 hover:bg-slate-200`}>
              <Undo2 className="w-3.5 h-3.5 shrink-0" /> Unpublish
            </button>
          )}

          {isLoadedFromSaved && (
            <button
              onClick={handleCreateNew}
              className="cursor-pointer justify-center py-1.5 px-3 rounded-md text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 bg-blue-100 text-blue-700 hover:bg-blue-200"
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0" /> Create New
            </button>
          )}

          {generatedHtml && (
            <button
              onClick={handleSave}
              disabled={isSaving || saveSuccess || (!isDirty && isLoadedFromSaved) || lockedForAuthor}
              title={lockedForAuthor ? 'Only a reviewer can change a published simulation' : undefined}
              className={`cursor-pointer justify-center py-1.5 px-3 rounded-md text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 ${
                (saveSuccess || (!isDirty && isLoadedFromSaved)) 
                  ? 'bg-primary-100 text-primary-800 cursor-default'
                  : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-primary-200'
              }`}
            >
              {isSaving ? (
                'Saving...'
              ) : (!isDirty && isLoadedFromSaved) ? (
                <><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Saved</>
              ) : saveSuccess ? (
                <><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Saved!</>
              ) : (
                <><Save className="w-3.5 h-3.5 shrink-0" /> {!loadedSimId ? 'Save draft' : loadedStatus === 'published' ? <>Save<span className="hidden sm:inline">&nbsp;live version</span></> : 'Save changes'}</>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-transparent rounded-lg overflow-auto relative flex flex-col">
        <PreviewContent 
          generatedHtml={generatedHtml} 
          generatedDescription={generatedDescription} 
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
}
