export default function ViewerHeaderSkeleton() {
  return (
    <header className="bg-white border border-slate-200 py-2.5 px-4 sm:px-6 shadow-sm flex items-center justify-between gap-2 shrink-0 z-20 relative mt-4 mx-4 mb-4 rounded-xl">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="p-1.5 rounded-lg shrink-0 w-8 h-8 bg-slate-200 animate-pulse"></div>
        <div className="min-w-0 flex flex-col gap-1.5">
          <div className="w-24 h-3 bg-slate-200 animate-pulse rounded"></div>
          <div className="w-48 sm:w-64 h-5 bg-slate-200 animate-pulse rounded"></div>
        </div>
      </div>
      <div className="flex flex-row shrink-0 gap-2">
        <div className="w-10 sm:w-24 h-9 rounded-lg bg-slate-200 animate-pulse shrink-0"></div>
        <div className="w-10 sm:w-24 h-9 rounded-lg bg-slate-200 animate-pulse shrink-0"></div>
      </div>
    </header>
  );
}
