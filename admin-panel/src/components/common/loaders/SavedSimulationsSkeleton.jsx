import { SimulationCardSkeleton } from './SimulationCardSkeleton';

export function SavedSimulationsSkeleton() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="bg-white p-3 sm:p-5 rounded-none sm:rounded-2xl shadow-sm border-0 sm:border border-slate-100 h-full flex flex-col">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 opacity-50">
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 p-1.5 rounded-lg w-8 h-8 flex items-center justify-center animate-pulse shrink-0">
              <div className="w-5 h-5 bg-slate-300 rounded"></div>
            </div>
            <div>
              <div className="h-4 sm:h-5 w-32 bg-slate-200 rounded animate-pulse mb-1"></div>
              <div className="h-3 w-48 sm:w-64 bg-slate-100 rounded animate-pulse"></div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {/* Search Bar Skeleton */}
            <div className="w-full sm:w-64 h-9 sm:h-10 bg-slate-100 rounded-lg animate-pulse"></div>
            
            {/* Filters Skeleton */}
            <div className="flex w-full sm:w-auto gap-2">
              <div className="w-full sm:w-48 h-9 sm:h-10 bg-slate-100 rounded-lg animate-pulse"></div>
              <div className="w-full sm:w-48 h-9 sm:h-10 bg-slate-100 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 content-start">
            {Array.from({ length: 10 }).map((_, index) => (
              <SimulationCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
