export function SimulationCardSkeleton() {
  return (
    <div className="flex flex-col text-left bg-white border-2 border-slate-100 p-2 sm:p-3.5 rounded-xl h-full min-h-27.5 sm:min-h-32.5">
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2 overflow-hidden w-full relative">
        <div className="p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-slate-100 animate-pulse w-5 h-5 sm:w-7 sm:h-7 shrink-0"></div>
        <div className="h-2.5 sm:h-3 w-16 sm:w-20 bg-slate-100 rounded animate-pulse"></div>
      </div>
      <div className="h-3 sm:h-4 w-3/4 bg-slate-100 rounded animate-pulse mb-1.5 sm:mb-2 mt-1"></div>
      <div className="h-3 sm:h-4 w-1/2 bg-slate-100 rounded animate-pulse mb-1.5 sm:mb-2"></div>
      <div className="mt-auto pt-1.5 sm:pt-2 border-t border-slate-100 w-full flex items-center">
        <div className="h-2 sm:h-2.5 w-24 bg-slate-100 rounded animate-pulse"></div>
      </div>
    </div>
  );
}
