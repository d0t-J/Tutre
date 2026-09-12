import { useMemo } from 'react';
import { useSimulationViewer } from '../context/SimulationViewerContext';
import { preprocessLegacyMath } from '../../../utils/mathPreprocessor';
import { sanitizeHTML } from '../../../utils/sanitizeHTML';

export default function GuidePanel({ className = "" }) {
  const { simulation } = useSimulationViewer();
  const description = simulation?.description;

  const processedDescription = useMemo(() => {
    if (!description) {
      return 'No description provided.';
    }

    let html = preprocessLegacyMath(description);
    // Professionally wrap tables to make them horizontally scrollable without breaking the layout
    html = html.replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, (match) => {
      return `<div class="overflow-x-auto w-full my-4">${match}</div>`;
    });
    return sanitizeHTML(html);
  }, [description]);

  return (
    <div className={`flex flex-col bg-white overflow-hidden ${className}`}>
      <div className="flex-1 overflow-y-auto relative p-6 xl:p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm">i</span>
          Simulation Details
        </h2>
        <div
          className="prose prose-slate prose-primary prose-sm max-w-none text-slate-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: processedDescription }}
        />
      </div>
    </div>
  );
}
