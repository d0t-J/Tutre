export function LivePreviewSkeleton() {
  return (
    <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col h-full aspect-square sm:aspect-auto sm:min-h-100">
      <div className="flex items-center justify-between gap-2 mb-3 opacity-50">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5 whitespace-nowrap">
          <div className="w-4 h-4 bg-slate-300 rounded-full animate-pulse"></div>
          Live Preview
        </h2>
      </div>
      <div className="flex-1 min-h-0 bg-linear-to-br from-[#F1F5F9] to-white rounded-lg border-2 border-slate-200 overflow-hidden relative shadow-inner flex flex-col items-center justify-center p-6 text-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        
        {/* Animated Icon Skeleton */}
        <div className="relative mb-6 animate-pulse">
          <div className="absolute inset-0 bg-primary-100 rounded-full blur-xl opacity-40"></div>
          <div className="relative bg-slate-200 w-18.5 h-18.5 sm:w-28.5 sm:h-28.5 rounded-3xl shadow-sm border border-slate-300"></div>
        </div>

        {/* Title Skeleton */}
        <div className="h-5 sm:h-7 w-48 sm:w-64 bg-slate-200 rounded-md animate-pulse mb-3 relative z-10"></div>
        
        {/* Description Skeleton */}
        <div className="flex flex-col items-center gap-2 relative z-10 w-full max-w-sm animate-pulse">
          <div className="h-2.5 sm:h-3.5 w-full bg-slate-200 rounded"></div>
          <div className="h-2.5 sm:h-3.5 w-[85%] bg-slate-200 rounded"></div>
          <div className="h-2.5 sm:h-3.5 w-[65%] bg-slate-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}
