export default function SimulationTypeSelector({ dimension, setDimension }) {
  return (
    <div className="flex flex-col gap-1 mt-1">
      <label className="text-xs sm:text-sm font-semibold text-slate-600 ml-1">Simulation Type</label>
      <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
        <button
          type="button"
          onClick={() => setDimension('2D')}
          className={`flex-1 text-xs py-1.5 font-bold rounded-md transition-all cursor-pointer border ${dimension === '2D' ? 'bg-white shadow-sm text-primary-600 border-primary-500' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
        >
          2D Simulation
        </button>
        <button
          type="button"
          onClick={() => setDimension('3D')}
          className={`flex-1 text-xs py-1.5 font-bold rounded-md transition-all cursor-pointer border ${dimension === '3D' ? 'bg-white shadow-sm text-primary-600 border-primary-500' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
        >
          3D Simulation
        </button>
      </div>
    </div>
  );
}
