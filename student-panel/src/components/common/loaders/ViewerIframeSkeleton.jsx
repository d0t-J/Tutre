export default function ViewerIframeSkeleton() {
  return (
    <div className="flex-none xl:flex-1 w-full xl:w-auto xl:h-full relative overflow-hidden items-center justify-center flex flex-col min-w-0 min-h-0 bg-slate-50 border border-slate-200 rounded-xl shadow-sm shrink-0">
      <div className="w-full h-full bg-slate-50 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 w-full bg-slate-50">
          <div className="relative mb-8 mt-4">
            <div className="absolute inset-0 bg-slate-200 rounded-2xl animate-ping opacity-60"></div>
            <div className="absolute -inset-4 bg-slate-100 rounded-full animate-pulse blur-xl opacity-70"></div>
            <div className="relative w-16 h-16 bg-white border border-slate-200 shadow-xl rounded-2xl flex items-center justify-center z-10">
               <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-slate-400 animate-spin"></div>
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-1.5 mt-2">Loading Simulation...</h3>
          <p className="text-sm font-medium text-slate-500 animate-pulse max-w-50 text-center">
            Fetching data from server
          </p>
        </div>
      </div>
    </div>
  );
}
