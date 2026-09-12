import { BookOpen, Pencil, Eye, Sparkles, Loader2, X } from 'lucide-react';

export default function StudyGuideHeader({
  hasContent,
  isEditing,
  setIsEditing,
  generateNotes,
  isGeneratingGuide,
  onClose
}) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 shrink-0">
      <div>
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary-500" />
          Study Guide Editor
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">Edit or AI-generate the study guide for this topic.</p>
      </div>

      <div className="flex items-center gap-3">
        {(hasContent || isEditing) && (
          <>
            <div className="flex items-center gap-2 bg-slate-200/50 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${!isEditing ? 'bg-white shadow-sm text-primary-700' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200'}`}
              >
                {!isEditing ? <Pencil className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {!isEditing ? 'Edit Document' : 'Preview Document'}
              </button>
              <button
                type="button"
                onClick={generateNotes}
                disabled={isGeneratingGuide}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingGuide ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {isGeneratingGuide ? 'Generating...' : hasContent ? 'Regenerate with AI' : 'Generate with AI'}
              </button>
            </div>
            <div className="w-px h-6 bg-slate-300 mx-1"></div>
          </>
        )}

        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
          title="Close editor"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
