import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

export default function UpdateActions() {
  const { isUpdating, handleUpdate } = useSimulation();
  const [updatePrompt, setUpdatePrompt] = useState('');
  const [updateTarget, setUpdateTarget] = useState('both');

  return (
    <div className="mt-auto w-full flex flex-col gap-2 pt-2 border-t border-slate-200">
      <div className="flex items-center justify-between ml-1 mr-1">
        <label className="text-xs sm:text-sm font-semibold text-slate-600">Ask AI to update...</label>
        <select
          value={updateTarget}
          onChange={(e) => setUpdateTarget(e.target.value)}
          className="text-[10px] sm:text-xs p-1 rounded border border-slate-300 bg-slate-50 focus:border-primary-500 outline-none"
        >
          <option value="both">Both</option>
          <option value="simulation">Simulation Only</option>
          <option value="description">Description Only</option>
        </select>
      </div>
      <textarea
        value={updatePrompt}
        onChange={(e) => setUpdatePrompt(e.target.value)}
        placeholder="e.g. Make the background dark..."
        rows={2}
        className="w-full text-xs p-2 min-h-10 resize-y rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-100 outline-none transition-all"
      />
      <button
        type="button"
        onClick={() => {
          handleUpdate(updatePrompt, updateTarget);
          setUpdatePrompt('');
        }}
        disabled={!updatePrompt.trim() || isUpdating}
        className="cursor-pointer w-full py-1.5 sm:py-2 rounded-lg bg-primary-600 text-white text-xs sm:text-sm font-bold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-primary-200 transition-all flex items-center justify-center gap-2 active:scale-95"
      >
        {isUpdating ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Updating Preview...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" /> Apply AI Update
          </>
        )}
      </button>
    </div>
  );
}
