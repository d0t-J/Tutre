export function CurriculumSkeleton() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="bg-white p-3 sm:p-5 rounded-none sm:rounded-2xl shadow-sm border-0 sm:border border-slate-100 h-full flex flex-col">
        {/* Header Skeleton */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 opacity-50">
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 p-1.5 rounded-lg w-8 h-8 flex items-center justify-center animate-pulse shrink-0">
              <div className="w-5 h-5 bg-slate-300 rounded"></div>
            </div>
            <div>
              <div className="h-4 sm:h-5 w-40 bg-slate-200 rounded animate-pulse mb-1"></div>
              <div className="h-3 w-64 bg-slate-100 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="border-b border-slate-100 shrink-0 mb-4 flex gap-6 opacity-50">
          <div className="h-5 w-20 bg-slate-200 rounded animate-pulse mb-3"></div>
          <div className="h-5 w-20 bg-slate-200 rounded animate-pulse mb-3"></div>
          <div className="h-5 w-20 bg-slate-200 rounded animate-pulse mb-3"></div>
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 mt-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 content-start">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="flex flex-col bg-slate-50 border-2 border-slate-100 p-2 sm:p-3.5 rounded-xl h-30 animate-pulse">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-200 shrink-0"></div>
                </div>
                <div className="w-full h-3 sm:h-4 rounded bg-slate-200 mb-1.5 sm:mb-2"></div>
                <div className="w-2/3 h-3 sm:h-4 rounded bg-slate-200"></div>

                <div className="mt-auto pt-1.5 sm:pt-2 border-t border-slate-100 w-full">
                  <div className="w-20 sm:w-24 h-2 sm:h-2.5 rounded bg-slate-200"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
