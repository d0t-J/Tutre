import { Sparkles, RefreshCw } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import SimulationTypeSelector from './SimulationTypeSelector';

export default function TopicForm() {
  const { 
    topic, setTopic, 
    details, setDetails,
    customPrompt, setCustomPrompt,
    dimension, setDimension,
    isGeneratingSuggestions, handleGenerateSuggestions,
    uploadedFileName,
    isExtractingDetails, handleExtractDetails
  } = useSimulation();

  return (
    <div className="flex flex-col gap-1.5 flex-1 min-h-0">
      <div className="flex flex-col gap-1">
        <label className="text-xs sm:text-sm font-semibold text-slate-600 ml-1">Topic Name</label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Pendulum Motion..."
          disabled={isExtractingDetails}
          className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-100 outline-none transition-all disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col gap-1 flex-1 min-h-0">
        <div className="flex justify-between items-center ml-1">
          <label className="text-xs sm:text-sm font-semibold text-slate-600">Topic Details (Optional text)</label>
          {uploadedFileName ? (
            <button 
              type="button"
              onClick={handleExtractDetails}
              disabled={isExtractingDetails}
              className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-primary-600 hover:text-primary-700 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {isExtractingDetails ? (
                <><RefreshCw className="w-3 h-3 animate-spin" /> Extracting...</>
              ) : (
                <><Sparkles className="w-3 h-3" /> Extract from HTML</>
              )}
            </button>
          ) : (
            <button 
              type="button"
              onClick={handleGenerateSuggestions}
              disabled={isGeneratingSuggestions || !topic.trim()}
              className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-primary-600 hover:text-primary-700 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {isGeneratingSuggestions ? (
                <><RefreshCw className="w-3 h-3 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-3 h-3" /> Auto-fill details</>
              )}
            </button>
          )}
        </div>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="e.g. It should show kinetic and potential energy bars..."
          rows={2}
          disabled={isExtractingDetails}
          className="w-full text-xs p-2 flex-1 min-h-10 resize-y rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-100 outline-none transition-all disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs sm:text-sm font-semibold text-slate-600 ml-1">Customization Prompt (Optional)</label>
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="e.g. Make it dark mode, or use neon colors..."
          rows={2}
          className="w-full text-xs p-2 min-h-10 resize-y rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-100 outline-none transition-all"
        />
      </div>

      <SimulationTypeSelector dimension={dimension} setDimension={setDimension} />
    </div>
  );
}
