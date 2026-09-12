import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { slugify } from '../../../utils/slugify';
import { EmptyState } from '../../../components/common';

export default function SubjectGrid({ classSlug, subjects, status }) {
  if (status === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Icons.GraduationCap className="w-16 h-16 text-primary-600 animate-scale-pulse" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-red-200 text-red-500 font-medium text-lg">
        Error loading subjects. Please try again.
      </div>
    );
  }

  if (!subjects || subjects.length === 0) {
    return (
      <EmptyState 
        title="No subjects found"
        message="No subjects available for this class yet." 
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full flex-1 py-2 sm:py-8 relative z-10">
      
      <div className="text-center max-w-2xl animate-fade-in-up flex flex-col items-center mb-3 sm:mb-8">
        <div className="w-10 h-10 sm:w-16 sm:h-16 bg-linear-to-br from-primary-100 to-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-6 shadow-sm border border-primary-100/50">
          <Icons.Library className="w-5 h-5 sm:w-8 sm:h-8 text-primary-600" />
        </div>
        <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1 sm:mb-4">Select a Subject</h2>
        <p className="[@media(max-height:650px)]:hidden text-sm sm:text-base text-slate-500 font-medium leading-relaxed max-w-lg px-2 sm:px-0">
          Choose a subject from the list below to view its chapters and dive into interactive learning.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-3 sm:gap-4 w-full max-w-[320px] sm:max-w-2xl lg:max-w-4xl mx-auto">
      {subjects.map((subject) => {
        const fallbackMap = {
          'biology': 'Dna',
          'chemistry': 'FlaskConical',
          'mathematics': 'Calculator',
          'physics': 'Atom',
          'computer-science': 'Laptop',
          'english': 'BookOpen'
        };
        const subjectSlug = slugify(subject.name);
        // Prioritize our curated fallback map over generic DB icons
        const iconName = fallbackMap[subjectSlug] || subject.icon_name || 'Book';
        const Icon = Icons[iconName] || Icons.Book;

        return (
          <Link
            key={subject.id}
            to={`/class/${classSlug}/subject/${slugify(subject.name)}`}
            className="flex flex-col items-center justify-center gap-2 w-full sm:w-48 px-4 sm:px-6 py-4 sm:py-4 bg-white hover:bg-slate-50 border-2 border-slate-100 hover:border-primary-100 rounded-2xl shadow-sm hover:shadow-md text-base text-slate-700 font-bold transition-all cursor-pointer group"
          >
            <div className="p-2.5 bg-slate-50 group-hover:bg-primary-50 rounded-xl transition-colors">
              <Icon className="w-6 h-6 text-slate-400 group-hover:text-primary-600 transition-colors" />
            </div>
            {subject.name}
          </Link>
        );
      })}
      </div>
    </div>
  );
}
