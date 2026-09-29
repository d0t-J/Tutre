import { BookOpen, MessageCircle } from 'lucide-react';
import Chatbot from './Chatbot';
import GuidePanel from './GuidePanel';
import { useSimulationViewer } from '../context/SimulationViewerContext';

export default function SimulationTabs({ className = "" }) {
  const { activeTab, setActiveTab } = useSimulationViewer();

  return (
    <div className={`flex-none shrink-0 w-full h-150 xl:h-auto xl:min-h-0 bg-white rounded-xl border border-slate-200 flex flex-col shadow-sm z-10 overflow-hidden ${className}`}>
      <div className="flex border-b border-slate-200 shrink-0">
        <button
          onClick={() => setActiveTab('guide')}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${activeTab === 'guide' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <BookOpen className="w-4 h-4" />
          Guide
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${activeTab === 'chat' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <MessageCircle className="w-4 h-4" />
          AI Tutor
        </button>
      </div>

      <div className="flex-1 overflow-hidden relative flex flex-col">
        {activeTab === 'guide' ? (
          <GuidePanel className="flex-1 h-full w-full" />
        ) : (
          <Chatbot />
        )}
      </div>
    </div>
  );
}
