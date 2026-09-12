import { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import LivePreview from '../LivePreview';
import { Undo2, Redo2 } from 'lucide-react';
import WorkspaceRightPanel from './Step3/WorkspaceRightPanel';

export default function Step3Workspace() {
  const { generatedHtml, setGeneratedHtml } = useSimulation();

  // History state for Undo/Redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [prevHtml, setPrevHtml] = useState(null);

  // Update history when generatedHtml changes (adjust state during render)
  // This is the React-recommended pattern for deriving state from props/context.
  // See: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (generatedHtml && generatedHtml !== prevHtml) {
    setPrevHtml(generatedHtml);
    // Avoid adding duplicate consecutive entries
    if (history.length === 0 || history[historyIndex] !== generatedHtml) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(generatedHtml);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setGeneratedHtml(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setGeneratedHtml(history[historyIndex + 1]);
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row p-4 gap-4">
      
      {/* Left: Live Preview */}
      <div className="flex-1 flex flex-col relative min-h-100 lg:min-h-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <LivePreview 
          headerControls={
            <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-full border border-slate-200">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                aria-label="Undo"
                className="p-1.5 rounded-full text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
                title="Undo AI Update"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <div className="px-2 text-[11px] font-bold text-slate-500 font-mono">
                V.{historyIndex + 1}
              </div>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                aria-label="Redo"
                className="p-1.5 rounded-full text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
                title="Redo AI Update"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>
          }
        />
      </div>

      {/* Right: Workspace Controls */}
      <WorkspaceRightPanel />

    </div>
  );
}
