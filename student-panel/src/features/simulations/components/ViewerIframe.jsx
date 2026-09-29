import { useSimulationViewer } from '../context/SimulationViewerContext';
import { ResponsiveSimulationFrame } from '../../../components/common';

export default function ViewerIframe() {
  const { iframeRef, iframeLoading, setIframeLoading, simulation } = useSimulationViewer();

  if (!simulation?.code_payload) {
    return (
      <div className="flex-none xl:flex-1 flex flex-col w-full xl:w-auto relative bg-slate-50 rounded-xl shadow-sm border border-slate-200 overflow-hidden items-center justify-center p-8 text-center min-h-100">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 border border-slate-200">
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-700 mb-2">No Simulation Selected</h3>
        <p className="text-sm text-slate-500 max-w-sm">Select a simulation from the sidebar to view it here, or generate a new one.</p>
      </div>
    );
  }

  return (
    <ResponsiveSimulationFrame 
      srcDoc={simulation.code_payload}
      title={simulation.topic}
      iconName={simulation.icon_name}
      iframeRef={iframeRef}
      iframeLoading={iframeLoading}
      setIframeLoading={setIframeLoading}
      containerClassName="flex flex-col xl:flex-1 w-full aspect-[4/3] xl:aspect-auto shrink-0 xl:shrink xl:h-full min-h-0 relative items-center justify-center overflow-hidden"
      wrapperClassName="bg-slate-50 border-2 border-slate-200 rounded-xl overflow-hidden shadow-inner flex items-center justify-center shrink-0 relative"
    />
  );
}
