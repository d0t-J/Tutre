import { useState } from 'react';
import { Send, Info } from 'lucide-react';
import { useSimulation } from '../../../context/SimulationContext';

export default function WorkspaceAIUpdater() {
  const { handleUpdate, isUpdating } = useSimulation();
  const [aiUpdatePrompt, setAiUpdatePrompt] = useState('');
  const [updateTarget, setUpdateTarget] = useState('both');

  const handleSendUpdate = async () => {
    if (!aiUpdatePrompt.trim()) return;
    await handleUpdate(aiUpdatePrompt, updateTarget);
    setAiUpdatePrompt('');
  };

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
        <h3 className="text-xs font-bold text-slate-800 mb-2">What do you want to update?</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input type="radio" name="target" value="animation" checked={updateTarget === 'animation'} onChange={(e) => setUpdateTarget(e.target.value)} className="text-primary-600 focus:ring-primary-500" />
            Animation Only
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input type="radio" name="target" value="description" checked={updateTarget === 'description'} onChange={(e) => setUpdateTarget(e.target.value)} className="text-primary-600 focus:ring-primary-500" />
            Description Only
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input type="radio" name="target" value="both" checked={updateTarget === 'both'} onChange={(e) => setUpdateTarget(e.target.value)} className="text-primary-600 focus:ring-primary-500" />
            Both
          </label>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col relative min-h-40">
        <textarea
          placeholder="e.g. Change the ball color to red and make it bounce higher..."
          value={aiUpdatePrompt}
          onChange={e => setAiUpdatePrompt(e.target.value)}
          className="w-full flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none custom-scrollbar pb-14"
        />
        <button 
          type="button"
          onClick={handleSendUpdate}
          disabled={isUpdating || !aiUpdatePrompt.trim()}
          className="cursor-pointer absolute bottom-3 right-3 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          {isUpdating ? 'Updating Preview...' : 'Apply Update'}
        </button>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-blue-50 border border-blue-100 p-2 rounded-lg">
        <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span>Click <strong>Update to Student App</strong> above the preview to save to database.</span>
      </div>
    </div>
  );
}
