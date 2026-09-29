import * as Icons from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../../services/supabase';

function ChapterNameLabel({ chapterId }) {
  const { data: chapterName, isLoading } = useQuery({
    queryKey: ['chapterName', chapterId],
    queryFn: async () => {
      if (!chapterId) return null;
      const { data } = await supabase.from('chapters').select('name').eq('id', chapterId).single();
      return data?.name || null;
    },
    staleTime: 1000 * 60 * 60,
    enabled: !!chapterId
  });

  if (isLoading) return <span className="opacity-50">Loading...</span>;
  if (!chapterName) return <span>&nbsp;</span>;
  return <span>{chapterName}</span>;
}

const FALLBACK_MAP = {
  'Biology': 'Dna',
  'biology': 'Dna',
  'Chemistry': 'FlaskConical',
  'chemistry': 'FlaskConical',
  'Mathematics': 'Calculator',
  'mathematics': 'Calculator',
  'Physics': 'Atom',
  'physics': 'Atom',
  'Computer Science': 'Laptop',
  'computer science': 'Laptop',
  'computer-science': 'Laptop',
  'English': 'BookOpen',
  'english': 'BookOpen'
};

export default function SimulationGridCard({ sim, theme, onSelect, onDelete }) {
  const iconName = FALLBACK_MAP[sim.subject] || sim.icon_name || 'Book';
  const Icon = Icons[iconName] || Icons.Book;

  return (
    <div
      onClick={() => onSelect(sim)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(sim);
        }
      }}
      className="cursor-pointer flex flex-col text-left bg-white border-2 border-slate-100 p-2 sm:p-3.5 rounded-xl hover:border-primary-300 hover:shadow-lg transition-all group active:scale-95 h-full focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2 overflow-hidden w-full relative">
        <div className={`p-1 sm:p-1.5 rounded-md sm:rounded-lg ${theme.bg} ${theme.color} shrink-0`}>
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <span className="font-bold text-[10px] sm:text-xs text-slate-500 truncate">{sim.subject}</span>
        
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(sim); }}
          className="cursor-pointer ml-auto p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
          aria-label="Delete simulation"
          title="Delete Simulation"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <h3 className="text-xs sm:text-sm font-bold text-slate-800 mb-1.5 sm:mb-2 group-hover:text-primary-600 transition-colors line-clamp-2 leading-tight pr-6 min-h-[2.5em]">
        {sim.topic}
      </h3>
      <p className="text-[9px] sm:text-xs text-slate-400 mt-auto pt-1.5 sm:pt-2 border-t border-slate-100 w-full truncate">
        {sim.chapter_id ? <ChapterNameLabel chapterId={sim.chapter_id} /> : <span>&nbsp;</span>}
      </p>
    </div>
  );
}
