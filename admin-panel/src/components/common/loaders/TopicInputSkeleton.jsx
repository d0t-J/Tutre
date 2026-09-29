export function TopicInputSkeleton() {
  return (
    <div className="bg-white p-2 sm:p-3 rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col gap-2">
      <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2 opacity-50">
        <span className="bg-slate-100 text-slate-600 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px]">3</span>
        Enter Details
      </h2>
      <div className="flex flex-col md:grid md:grid-cols-2 lg:flex lg:flex-col gap-2 flex-1 min-h-0">
        <div className="flex flex-col gap-1.5 flex-1 min-h-0 animate-pulse">
          <div className="flex flex-col gap-1">
            <div className="h-3 sm:h-4 w-20 bg-slate-200 rounded ml-1"></div>
            <div className="w-full h-8 bg-slate-100 rounded-lg border border-slate-200"></div>
          </div>
          <div className="flex flex-col gap-1 flex-1 min-h-0 mt-1">
            <div className="flex justify-between items-center ml-1">
              <div className="h-3 sm:h-4 w-32 bg-slate-200 rounded"></div>
              <div className="h-3 sm:h-4 w-20 bg-slate-200 rounded"></div>
            </div>
            <div className="w-full flex-1 min-h-10 bg-slate-100 rounded-lg border border-slate-200"></div>
          </div>
          <div className="flex flex-col gap-1 mt-1">
            <div className="h-3 sm:h-4 w-40 bg-slate-200 rounded ml-1"></div>
            <div className="w-full h-10 bg-slate-100 rounded-lg border border-slate-200"></div>
          </div>
        </div>
        <div className="flex flex-col gap-3 shrink-0 animate-pulse mt-2 md:mt-0 lg:mt-2">
          <div className="w-full flex-1 min-h-12.5 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 flex flex-col gap-2">
            <div className="w-full flex-1 min-h-12.5"></div>
          </div>
          <div className="w-full h-8 sm:h-9 bg-slate-200 rounded-lg mt-auto"></div>
        </div>
      </div>
    </div>
  );
}
