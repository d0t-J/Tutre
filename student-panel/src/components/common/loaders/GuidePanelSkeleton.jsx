export default function GuidePanelSkeleton() {
  return (
    <div className="hidden xl:flex h-full xl:w-1/4 min-w-65 max-w-90 shrink-0 rounded-xl shadow-sm border border-slate-200 z-10 flex-col bg-white overflow-hidden">
      <div className="flex-1 overflow-y-auto relative p-6 xl:p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="bg-slate-200 animate-pulse w-8 h-8 rounded-full flex shrink-0"></span>
          <div className="h-6 w-3/4 bg-slate-200 animate-pulse rounded"></div>
        </h2>
        <div className="flex flex-col gap-3">
          <div className="h-4 w-full bg-slate-100 animate-pulse rounded"></div>
          <div className="h-4 w-11/12 bg-slate-100 animate-pulse rounded"></div>
          <div className="h-4 w-4/5 bg-slate-100 animate-pulse rounded"></div>
          <div className="h-4 w-full bg-slate-100 animate-pulse rounded mt-2"></div>
          <div className="h-4 w-5/6 bg-slate-100 animate-pulse rounded"></div>
          <div className="h-32 w-full bg-slate-100 animate-pulse rounded-xl mt-4"></div>
        </div>
      </div>
    </div>
  );
}
