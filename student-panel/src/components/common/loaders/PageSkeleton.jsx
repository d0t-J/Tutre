export default function PageSkeleton() {
  return (
    <div className="absolute inset-0 p-0 sm:p-4 lg:p-6 flex flex-col">
      <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-none sm:rounded-2xl shadow-sm border-0 sm:border border-slate-100 flex-1 flex flex-col min-h-0">
        <div className="animate-pulse flex flex-col h-full w-full">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-xl shrink-0"></div>
              <div className="flex flex-col gap-2">
                <div className="h-5 bg-slate-100 rounded w-48"></div>
                <div className="h-3 bg-slate-100 rounded w-64"></div>
              </div>
            </div>
            <div className="w-full md:w-72 lg:w-96 h-10 bg-slate-100 rounded-lg"></div>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="h-10 w-24 bg-slate-100 rounded-lg"></div>
            <div className="h-10 w-24 bg-slate-100 rounded-lg"></div>
            <div className="h-10 w-24 bg-slate-100 rounded-lg"></div>
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-1 content-start">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 h-40 flex flex-col justify-between shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
                  <div className="w-16 h-6 bg-slate-100 rounded-full"></div>
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
