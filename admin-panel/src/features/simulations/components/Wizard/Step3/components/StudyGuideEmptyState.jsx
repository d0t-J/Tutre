import { BookOpen, Sparkles, Pencil, Loader2 } from 'lucide-react';

export default function StudyGuideEmptyState({ generateNotes, isGeneratingGuide, onWriteManually }) {
  return (
    <div className="h-full flex-1 w-full flex items-center justify-center p-6 overflow-hidden">
      <div className="bg-white shadow-sm border border-slate-200 w-full max-w-lg rounded-2xl p-8 sm:p-10 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4 border border-primary-100/80 shadow-xs">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">No Study Guide Found</h3>
        <p className="text-sm text-slate-500 max-w-sm mb-8 leading-relaxed">
          There is no study guide description in the database for this topic yet. You can auto-generate a comprehensive study guide using AI or write one manually.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={generateNotes}
            disabled={isGeneratingGuide}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-lg shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isGeneratingGuide ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isGeneratingGuide ? 'Generating...' : 'Generate with AI'}
          </button>
          <button
            type="button"
            onClick={onWriteManually}
            className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-lg border border-slate-300 shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Pencil className="w-4 h-4 text-slate-500" />
            Write Manually
          </button>
        </div>
      </div>
    </div>
  );
}
