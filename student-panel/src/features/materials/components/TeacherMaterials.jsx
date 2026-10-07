import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, MonitorPlay, Presentation } from 'lucide-react';
import { useSharedMaterials } from '../hooks/useTeacherMaterials';

const KIND = {
  simulation: { Icon: MonitorPlay, colors: 'bg-primary-50 text-primary-600' },
  notes: { Icon: FileText, colors: 'bg-amber-50 text-amber-600' },
};

// "From your teacher": what the student's teachers shared with their sections
// for this chapter. Shown below Tutre's own simulations; nothing at all when
// there is none.
export default function TeacherMaterials({ chapterId }) {
  const { t } = useTranslation('materials');
  const { classSlug, subjectSlug, chapterSlug } = useParams();
  const { data: materials = [] } = useSharedMaterials(chapterId);

  if (materials.length === 0) return null;

  return (
    <section className="mt-8" aria-labelledby="teacher-materials-title">
      <h2 id="teacher-materials-title" className="flex items-center gap-2 text-sm font-extrabold text-slate-700 mb-3">
        <Presentation className="w-4 h-4 text-amber-600" /> {t('fromTeacher')}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {materials.map(m => {
          const { Icon, colors } = KIND[m.kind];
          return (
            <Link
              key={m.id}
              to={`/class/${classSlug}/subject/${subjectSlug}/chapter/${chapterSlug}/material/${m.id}`}
              className="cursor-pointer flex flex-col text-start bg-white border-2 border-amber-100 p-3.5 rounded-xl hover:border-amber-300 hover:shadow-lg transition-all group active:scale-95 h-full"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg shrink-0 ${colors}`}><Icon className="w-4 h-4" /></div>
                <span className="font-bold text-xs text-slate-500">{t(`kind.${m.kind}`)}</span>
              </div>
              <h3 dir="auto" className="text-sm font-bold text-slate-800 mb-2 group-hover:text-amber-700 line-clamp-2 leading-tight">{m.title}</h3>
              <p className="text-xs text-slate-400 mt-auto pt-2 border-t border-slate-100 truncate">
                {t('by', { name: m.owner_name ?? t('yourTeacher') })}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
