import { Sparkles } from 'lucide-react';
import { useState, useMemo } from 'react';
import { injectResponsiveCSS } from './utils';
import { preprocessLegacyMath } from '../../utils/mathPreprocessor';
import { useWizard } from '../../context/WizardContext';
import { sanitizeHTML } from '../../../../utils/sanitizeHTML';

import { useIframeHeight } from './hooks/useIframeHeight';
import { GeneratingState } from './components/GeneratingState';
import { ReadyState } from './components/ReadyState';
import ResponsiveSimulationFrame from '../../../../components/common/ResponsiveSimulationFrame';

export default function PreviewContent({ generatedHtml, generatedDescription, isGenerating }) {
  const { viewMode } = useWizard();
  const [activeTab, setActiveTab] = useState('simulation');
  
  const {
    iframeLoading,
    setIframeLoading,
    iframeRef,
  } = useIframeHeight(generatedHtml);

  const processedDescription = useMemo(() => {
    if (!generatedDescription) return '';
    return sanitizeHTML(preprocessLegacyMath(generatedDescription));
  }, [generatedDescription]);

  const processedHtml = useMemo(
    () => injectResponsiveCSS(generatedHtml),
    [generatedHtml]
  );

  if (isGenerating) {
    return <GeneratingState />;
  }

  if (!generatedHtml) {
    return <ReadyState />;
  }

  return (
    <div className="flex flex-col w-full h-full flex-1 overflow-hidden bg-transparent relative rounded-xl border border-slate-200">
      {viewMode === 'classic' && processedDescription && (
        <div className="flex justify-center p-2 bg-slate-50 border-b border-slate-200 gap-2 shrink-0">
          <button 
            onClick={() => setActiveTab('simulation')}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
              activeTab === 'simulation' 
                ? 'bg-white text-primary-700 shadow-sm border border-slate-200' 
                : 'text-slate-500 hover:bg-slate-200'
            }`}
          >
            Simulation
          </button>
          <button 
            onClick={() => setActiveTab('description')}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
              activeTab === 'description' 
                ? 'bg-white text-primary-700 shadow-sm border border-slate-200' 
                : 'text-slate-500 hover:bg-slate-200'
            }`}
          >
            Description
          </button>
        </div>
      )}

      <div className="flex-1 relative bg-transparent flex flex-col min-h-0">
        <ResponsiveSimulationFrame 
          srcDoc={processedHtml}
          iframeRef={iframeRef}
          iframeLoading={iframeLoading}
          setIframeLoading={setIframeLoading}
        />

        {viewMode === 'classic' && processedDescription && activeTab === 'description' && (
          <div className="absolute inset-0 bg-white flex flex-col overflow-y-auto custom-scrollbar z-10">
            <div className="p-4 sm:p-5 lg:p-6 min-h-full">
              <h3 className="text-sm font-extrabold text-slate-800 mb-4 tracking-wider uppercase flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-500" />
                Description & Guide
              </h3>
              <div
                className="prose prose-slate prose-sm sm:prose-base max-w-none text-slate-700 selectable-text"
                dangerouslySetInnerHTML={{ __html: processedDescription }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
