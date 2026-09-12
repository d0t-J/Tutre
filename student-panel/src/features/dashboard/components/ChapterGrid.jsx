import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { slugify } from '../../../utils/slugify';
import { EmptyState } from '../../../components/common';
import { getDeterministicIcon } from '../../../utils/iconHelper';

export default function ChapterGrid({ classSlug, subjectSlug, chapters, status, subjectIcon }) {
  const Icon = subjectIcon ? (Icons[subjectIcon] || Icons.BookOpen) : Icons.BookOpen;

  if (status === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Icon className="w-16 h-16 text-primary-600 animate-scale-pulse" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-red-200 text-red-500 font-medium text-lg">
        Error loading chapters. Please try again.
      </div>
    );
  }

  if (!chapters || chapters.length === 0) {
    return (
      <EmptyState 
        title="No chapters found"
        message="No chapters available for this subject yet." 
      />
    );
  }

  return (
    <div className="flex-1 w-full pt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 content-start">
      {chapters.map((chapter, index) => {
        return (
          <Link
            key={chapter.id}
            to={`/class/${classSlug}/subject/${subjectSlug}/chapter/${slugify(chapter.name)}`}
            className="cursor-pointer flex flex-col text-left bg-white border-2 border-slate-100 p-2 sm:p-3.5 rounded-xl hover:border-primary-300 hover:shadow-lg transition-all group active:scale-95 h-full"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2 overflow-hidden w-full relative">
              <div className="p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-primary-50 text-primary-600 shrink-0">
                {(() => {
                  const ChapterIcon = getDeterministicIcon(chapter.id, chapter.name, index);
                  return <ChapterIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
                })()}
              </div>
              <span className="font-bold text-[10px] sm:text-xs text-slate-500 truncate">
                Chapter {chapter.chapter_no || index + 1}
              </span>
            </div>
            
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 mb-1.5 sm:mb-2 group-hover:text-primary-600 transition-colors line-clamp-2 leading-tight min-h-[2.5em]">
              {chapter.name}
            </h3>
            
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-auto pt-2 border-t border-slate-100 w-full line-clamp-2 leading-snug" title={chapter.description}>
              {chapter.description ? chapter.description : <span className="capitalize">{subjectSlug.replace(/-/g, ' ')}</span>}
            </p>
          </Link>
        );
      })}
      </div>
    </div>
  );
}
