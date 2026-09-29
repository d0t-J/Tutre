import { useSimulation } from '../../context/SimulationContext';

export default function TopicDetailsForm() {
  const { topic, setTopic, details, setDetails, dimension, setDimension } = useSimulation();

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1.5">Topic Name *</label>
        <input
          type="text"
          placeholder="e.g., Simple Harmonic Motion, Halogenation of Methane"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1.5">Detailed Description (Optional)</label>
        <textarea
          placeholder="Describe exactly what should happen in the simulation..."
          value={details}
          onChange={e => setDetails(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
        />
      </div>

      <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-3 w-full">
        <label className="text-xs sm:text-sm font-bold text-slate-700 whitespace-nowrap">Simulation Dimension:</label>
        <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
          <button 
            onClick={() => setDimension('2D')} 
            className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${dimension === '2D' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            2D <span className="hidden sm:inline">Mode</span>
          </button>
          <button 
            onClick={() => setDimension('3D')} 
            className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${dimension === '3D' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            3D <span className="hidden sm:inline">Mode</span>
          </button>
        </div>
      </div>
    </div>
  );
}
