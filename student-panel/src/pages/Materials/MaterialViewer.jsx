import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FileText } from 'lucide-react';
import { useSharedMaterial, toViewerSource } from '../../features/materials/hooks/useTeacherMaterials';
import { TeacherSimulationViewerProvider } from '../../features/simulations/context/SimulationViewerProvider';
import { SimulationViewerContent } from '../Simulations/SimulationViewer';
import { SimulationViewerSkeleton } from '../../components/common';
import { sanitizeHTML } from '../../utils/sanitizeHTML';
import { preprocessLegacyMath } from '../../utils/mathPreprocessor';

// A teacher's notes. Written by a teacher, so cleaned before display like any
// HTML from the database.
function NotesView({ material, backLink }) {
  const { t } = useTranslation('materials');
  const html = useMemo(() => sanitizeHTML(preprocessLegacyMath(material.content)), [material.content]);
  return (
    <div className="h-full overflow-y-auto bg-[#FDFBF7]">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4">
        <Link to={backLink} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" /> {t('common:actions.back')}
        </Link>
        <article className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1">
            <FileText className="w-3.5 h-3.5" />
            {t('teacherNotes', { name: material.ownerName ?? t('yourTeacher') })}
          </p>
          <h1 dir="auto" className="text-2xl font-extrabold text-slate-900 mb-6">{material.title}</h1>
          <div
            dir={material.language === 'ur' ? 'rtl' : 'ltr'}
            lang={material.language}
            className="prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>
      </div>
    </div>
  );
}

export default function MaterialViewer() {
  const { t } = useTranslation('materials');
  const { id, classSlug, subjectSlug, chapterSlug } = useParams();
  const { data: material, isLoading } = useSharedMaterial(id);
  const backLink = `/class/${classSlug}/subject/${subjectSlug}/chapter/${chapterSlug}`;

  if (isLoading) return <SimulationViewerSkeleton />;
  if (!material) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 p-6 text-center">
        <h2 className="text-xl font-bold">{t('notFound')}</h2>
        <Link to={backLink} className="text-primary-600 font-bold hover:underline">{t('common:actions.back')}</Link>
      </div>
    );
  }
  if (material.kind === 'notes') return <NotesView material={material} backLink={backLink} />;
  return (
    <TeacherSimulationViewerProvider key={material.id} source={toViewerSource(material)}>
      <SimulationViewerContent />
    </TeacherSimulationViewerProvider>
  );
}
