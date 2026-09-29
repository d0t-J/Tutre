import { useState } from 'react';
import JoditEditor from 'jodit-react';
import { useSimulation } from '../../../context/SimulationContext';
import { History, Layout, Eye, BookOpen } from 'lucide-react';
import { preprocessLegacyMath } from '../../../utils/mathPreprocessor';
import WorkspaceAIUpdater from './WorkspaceAIUpdater';
import { sanitizeHTML } from '../../../../../utils/sanitizeHTML';
import StudyGuideEditor from './StudyGuideEditor';

export default function WorkspaceRightPanel() {
  const { generatedDescription, setGeneratedDescription, generatedHtml, isGenerating } = useSimulation();
  const [activeTab, setActiveTab] = useState('preview');

  return (
    <div className="w-full lg:w-100 xl:w-125 shrink-0 flex flex-col gap-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-75">
        
        {/* Tab Navigation */}
        <div className="flex bg-slate-50 border-b border-slate-200 p-2 gap-2 shrink-0">
          <button 
            onClick={() => setActiveTab('preview')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'preview' ? 'bg-white shadow-sm text-primary-600 ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}
          >
            <Eye className="w-4 h-4" /> Preview
          </button>
          <button 
            onClick={() => setActiveTab('description')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'description' ? 'bg-white shadow-sm text-primary-600 ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}
          >
            <Layout className="w-4 h-4" /> Edit
          </button>
          <button 
            onClick={() => setActiveTab('ai_updater')}
            disabled={isGenerating || !generatedHtml}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'ai_updater' ? 'bg-white shadow-sm text-primary-600 ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-200/50 disabled:opacity-50'}`}
          >
            <History className="w-4 h-4" /> AI Update
          </button>
          <button 
            onClick={() => setActiveTab('study_guide')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'study_guide' ? 'bg-white shadow-sm text-primary-600 ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}
          >
            <BookOpen className="w-4 h-4" /> Study Guide
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col relative">
          {activeTab === 'preview' ? (
            <div className="h-full flex flex-col bg-white rounded-lg border border-slate-200 overflow-y-auto p-4 custom-scrollbar">
              {generatedDescription && generatedDescription.trim() ? (
                <div
                  className="prose prose-slate prose-sm max-w-none text-slate-700"
                  dangerouslySetInnerHTML={{ __html: sanitizeHTML(preprocessLegacyMath(generatedDescription || '')) }}
                />
              ) : (
                <div className="h-full min-h-60 flex flex-col items-center justify-center text-center p-6 text-slate-400 gap-3 my-auto">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">No Description Found</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                      There is no description in the database for this simulation. Switch to the Edit tab to write one or generate a new simulation.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'description' ? (
            <div className="h-full flex-1 w-full overflow-y-auto custom-jodit-wrapper">
              <JoditEditor
                value={preprocessLegacyMath(generatedDescription || '')}
                config={{
                  readonly: false,
                  placeholder: 'Write or edit the simulation description here...',
                  height: 'auto',
                  style: { height: '100%', minHeight: '300px' },
                  toolbarSticky: false,
                  showCharsCounter: false,
                  showWordsCounter: false,
                  showXPathInStatusbar: false,
                }}
                onBlur={newContent => setGeneratedDescription(newContent)}
              />
            </div>          ) : activeTab === 'study_guide' ? (
            <StudyGuideEditor />
          ) : (
            <WorkspaceAIUpdater />
          )}
        </div>

      </div>
    </div>
  );
}
