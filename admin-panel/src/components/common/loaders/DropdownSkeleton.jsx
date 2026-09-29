export function DropdownSkeleton({ number, label }) {
  return (
    <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 relative">
      <h2 className="text-xs sm:text-base whitespace-nowrap font-bold text-slate-800 mb-1.5 flex items-center gap-1.5 sm:gap-2 opacity-50">
        <span className="bg-slate-100 text-slate-600 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] shrink-0">{number}</span>
        {label}
      </h2>
      <div className="w-full flex items-center bg-slate-50 border border-slate-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg h-8.5 sm:h-10.5 animate-pulse">
         <div className="w-24 h-4 bg-slate-200 rounded"></div>
      </div>
    </div>
  );
}
