import { PlayCircle, Save, CheckCircle2, PlusCircle } from 'lucide-react';
import PreviewContent from './LivePreview/PreviewContent';
import { useSimulation } from '../context/SimulationContext';

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
    isGenerating
  } = useSimulation();

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
              disabled={isSaving || saveSuccess || (!isDirty && isLoadedFromSaved)}
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
                <><Save className="w-3.5 h-3.5 shrink-0" /> {loadedSimId ? 'Update' : 'Publish'}<span className="hidden sm:inline"> to Student App</span></>
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
