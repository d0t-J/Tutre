import { DashboardHeader, DashboardGrid, DashboardLanding, SubjectGrid, ChapterGrid, useDashboardState } from '../../features/dashboard';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';
import { DotField } from '../../components/common';
import TeacherMaterials from '../../features/materials/components/TeacherMaterials';
export default function Dashboard() {
  const { t } = useTranslation('materials');
  const {
    classSlug,
    subjectSlug,
    chapterSlug,
    searchQuery,
    setSearchQuery,
    classes,
    isLoadingClasses,
    subjects,
    subjectsStatus,
    chapters,
    chaptersStatus,
    status, // simulations status
    subjectIcon,
    simulations,
    isFetchingNextPage,
    lastElementRef,
    breadcrumbs,
    chapterId,
  } = useDashboardState();

  if (!classSlug) {
    return <DashboardLanding classes={classes} isLoading={isLoadingClasses} />;
  }

  return (
    <div className="absolute inset-0 p-0 sm:p-4 lg:p-6 flex flex-col">
      <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-none sm:rounded-2xl shadow-sm border-0 sm:border border-slate-100 flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <DotField dotRadius={1.5} dotSpacing={14} />
        </div>
        
        <DashboardHeader 
          breadcrumbs={breadcrumbs}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showSearch={!!subjectSlug}
        />

        <div 
          className="flex flex-col flex-1 overflow-y-auto min-h-0 pe-1 sm:pe-2 [&::-webkit-scrollbar]:hidden mt-2 relative z-10"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {!subjectSlug ? (
            <SubjectGrid classSlug={classSlug} subjects={subjects} status={subjectsStatus} />
          ) : !chapterSlug ? (
            <ChapterGrid classSlug={classSlug} subjectSlug={subjectSlug} chapters={chapters} status={chaptersStatus} subjectIcon={subjectIcon} />
          ) : (
            // A plain block, so the grid does not stretch and push the teacher's
            // section to the bottom.
            <div>
              {/* Tutre's own simulations first, then the student's teachers' (Phase 5e). */}
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-700 mb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> {t('tutreVerified')}
              </h2>
              <DashboardGrid 
                status={status}
                subjectIcon={subjectIcon}
                simulations={simulations}
                isFetchingNextPage={isFetchingNextPage}
                lastElementRef={lastElementRef}
              />
              <TeacherMaterials chapterId={chapterId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}