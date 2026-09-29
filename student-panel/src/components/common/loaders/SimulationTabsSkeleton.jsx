export default function SimulationTabsSkeleton() {
  return (
    <div className="xl:hidden w-full">
      <div className="flex-none shrink-0 w-full h-150 xl:h-auto xl:min-h-0 bg-white rounded-xl border border-slate-200 flex flex-col shadow-sm z-10 overflow-hidden">
        <div className="flex border-b border-slate-200 shrink-0">
          <div className="flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 text-slate-300 bg-slate-50 animate-pulse">
            <div className="w-4 h-4 rounded-full bg-slate-200"></div>
            <div className="w-12 h-4 rounded bg-slate-200"></div>
          </div>
          <div className="flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 text-slate-300 bg-slate-50 animate-pulse">
            <div className="w-4 h-4 rounded-full bg-slate-200"></div>
            <div className="w-16 h-4 rounded bg-slate-200"></div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden relative flex flex-col p-6">
           <h2 className="text-xl font-bold mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
             <span className="bg-slate-200 animate-pulse w-8 h-8 rounded-full flex shrink-0"></span>
             <div className="h-6 w-3/4 bg-slate-200 animate-pulse rounded"></div>
           </h2>
           <div className="flex flex-col gap-3">
             <div className="h-4 w-full bg-slate-100 animate-pulse rounded"></div>
             <div className="h-4 w-11/12 bg-slate-100 animate-pulse rounded"></div>
             <div className="h-4 w-4/5 bg-slate-100 animate-pulse rounded"></div>
             <div className="h-32 w-full bg-slate-100 animate-pulse rounded-xl mt-4"></div>
           </div>
        </div>
      </div>
    </div>
  );
}
