export default function ChatbotSkeleton() {
  return (
    <div className="hidden xl:flex h-full xl:w-1/4 min-w-65 max-w-90 shrink-0 flex-col bg-white rounded-xl shadow-sm border border-slate-200 z-10 overflow-hidden">
      <div className="flex border-b border-slate-200 shrink-0">
        <div className="flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 text-slate-400 border-b-2 border-slate-200 bg-slate-50 animate-pulse">
          <div className="w-4 h-4 rounded-full bg-slate-300"></div>
          <div className="w-16 h-4 rounded bg-slate-300"></div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative flex flex-col p-4 justify-end gap-4">
        <div className="flex gap-2 items-end w-3/4">
          <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse shrink-0"></div>
          <div className="h-16 w-full bg-slate-100 rounded-2xl animate-pulse"></div>
        </div>
        <div className="flex gap-2 items-end justify-end w-3/4 self-end">
          <div className="h-12 w-full bg-slate-100 rounded-2xl animate-pulse"></div>
        </div>
      </div>
      <div className="h-16 bg-slate-50 border-t border-slate-200 m-2 rounded-xl animate-pulse shrink-0"></div>
    </div>
  );
}
