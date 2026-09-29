import { useRef } from 'react';
import { Sparkles, FileUp } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import UpdateActions from './UpdateActions';

export default function GenerateActions() {
  const {
    topic,
    generatedHtml,
    isGenerating,
    handleGenerate,
    handleFileUpload
  } = useSimulation();

  const fileInputRef = useRef(null);

  if (generatedHtml) {
    return <UpdateActions />;
  }

  return (
    <div className="mt-auto w-full flex flex-col gap-2">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={!topic.trim() || isGenerating}
        className="cursor-pointer w-full py-2 sm:py-2.5 rounded-lg bg-primary-600 text-white text-xs sm:text-sm font-bold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-primary-200 transition-all flex items-center justify-center gap-2 active:scale-95"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" /> Generate Simulation
          </>
        )}
      </button>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isGenerating}
        title="Upload a pre-built HTML animation file"
        className="cursor-pointer w-full py-2 sm:py-2.5 rounded-lg border-2 border-dashed border-slate-300 text-slate-600 text-xs sm:text-sm font-bold hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-95"
      >
        <FileUp className="w-4 h-4 sm:w-5 sm:h-5" /> Upload HTML
      </button>
      <input ref={fileInputRef} type="file" accept=".html,.htm" className="hidden" onChange={handleFileUpload} />
    </div>
  );
}
