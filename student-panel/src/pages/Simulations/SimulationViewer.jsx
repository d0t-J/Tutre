import { useParams, Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { SimulationViewerProvider } from '../../features/simulations/context/SimulationViewerProvider';
import { useSimulationViewer } from '../../features/simulations/context/SimulationViewerContext';
import { ViewerHeader, ViewerIframe, SimulationTabs, GuidePanel, Chatbot } from '../../features/simulations';
import { SimulationViewerSkeleton } from '../../components/common';

function SimulationViewerContent() {
  const { loading, simulation } = useSimulationViewer();

  if (loading) {
    return <SimulationViewerSkeleton />;
  }

  if (!simulation) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <h2 className="text-2xl font-bold mb-4">Simulation Not Found</h2>
        <Link to="/" className="text-primary-600 font-bold hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#FDFBF7]">
      <ViewerHeader />
      <main className="flex-1 relative flex flex-col xl:flex-row xl:items-center xl:justify-center overflow-y-auto xl:overflow-hidden px-4 pb-4 pt-0 gap-4">
        {/* Desktop Left Column: Guide */}
        <GuidePanel className="hidden xl:flex h-full xl:w-1/4 min-w-65 max-w-90 shrink-0 rounded-xl shadow-sm border border-slate-200 z-10" />
        
        {/* Center Column: Simulation */}
        <ViewerIframe />
        
        {/* Desktop Right Column: AI Tutor */}
        <div className="hidden xl:flex h-full xl:w-1/4 min-w-65 max-w-90 shrink-0 flex-col bg-white rounded-xl shadow-sm border border-slate-200 z-10 overflow-hidden">
          <div className="flex border-b border-slate-200 shrink-0">
            <div className="flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 text-primary-600 border-b-2 border-primary-600 bg-primary-50/50">
              <MessageCircle className="w-4 h-4" />
              AI Tutor
            </div>
          </div>
          <div className="flex-1 overflow-hidden relative flex flex-col">
            <Chatbot />
          </div>
        </div>

        {/* Mobile/Tablet Fallback: Tabs */}
        <div className="xl:hidden w-full">
          <SimulationTabs />
        </div>
      </main>
    </div>
  );
}

export default function SimulationViewer() {
  const { id } = useParams();
  
  return (
    <SimulationViewerProvider id={id}>
      <SimulationViewerContent />
    </SimulationViewerProvider>
  );
}
