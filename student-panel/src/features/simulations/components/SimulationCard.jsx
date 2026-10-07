import { Link, useParams } from 'react-router-dom';
import { slugify } from '../../../utils/slugify';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useContentText } from '../../../i18n/content';
import { supabase } from '../../../services/supabase';

function ChapterNameLabel({ chapterId }) {
  const { t } = useTranslation();
  const text = useContentText();
  const { data: chapterName, isLoading } = useQuery({
    queryKey: ['chapterName', chapterId],
    queryFn: async () => {
      if (!chapterId) return null;
      const { data } = await supabase.from('chapters').select('name').eq('id', chapterId).single();
      return data?.name || null;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: !!chapterId
  });

  if (isLoading) return <span className="opacity-50">{t('status.loading')}</span>;
  if (!chapterName) return <span>&nbsp;</span>;
  return <bdi>{text('chapter', chapterId, chapterName)}</bdi>;
}

export default function SimulationCard({ sim, icon: Icon, color, bg }) {
  const { chapterSlug } = useParams();
  const text = useContentText();

  const linkTo = chapterSlug 
    ? `/class/${slugify(sim.class_name)}/subject/${slugify(sim.subject)}/chapter/${chapterSlug}/simulation/${sim.sim_id}`
    : `/class/${slugify(sim.class_name)}/subject/${slugify(sim.subject)}/simulation/${sim.sim_id}`;

  return (
    <Link 
      to={linkTo}
      className="cursor-pointer flex flex-col text-start bg-white border-2 border-slate-100 p-2 sm:p-3.5 rounded-xl hover:border-primary-300 hover:shadow-lg transition-all group active:scale-95 h-full"
    >
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2 overflow-hidden w-full relative">
        <div className={`p-1 sm:p-1.5 rounded-md sm:rounded-lg ${bg} ${color} shrink-0`}>
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <span className="font-bold text-[10px] sm:text-xs text-slate-500 truncate"><bdi>{text('subject', sim.subject_id, sim.subject)}</bdi></span>
      </div>
      
      <h3 className="text-xs sm:text-sm font-bold text-slate-800 mb-1.5 sm:mb-2 group-hover:text-primary-600 transition-colors line-clamp-2 leading-tight pe-6 min-h-[2.5em]">
        <bdi>{text('topic', sim.topic_id, sim.topic)}</bdi>
      </h3>
      
      <p className="text-[9px] sm:text-xs text-slate-400 mt-auto pt-1.5 sm:pt-2 border-t border-slate-100 w-full truncate">
        {sim.chapter_id ? <ChapterNameLabel chapterId={sim.chapter_id} /> : <span>&nbsp;</span>}
      </p>
    </Link>
  );
}
