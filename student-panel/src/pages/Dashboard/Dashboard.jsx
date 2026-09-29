import { DashboardHeader, DashboardGrid, DashboardLanding, SubjectGrid, ChapterGrid, useDashboardState } from '../../features/dashboard';
import { DotField } from '../../components/common';
export default function Dashboard() {
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
          className="flex flex-col flex-1 overflow-y-auto min-h-0 pr-1 sm:pr-2 [&::-webkit-scrollbar]:hidden mt-2 relative z-10"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {!subjectSlug ? (
            <SubjectGrid classSlug={classSlug} subjects={subjects} status={subjectsStatus} />
          ) : !chapterSlug ? (
            <ChapterGrid classSlug={classSlug} subjectSlug={subjectSlug} chapters={chapters} status={chaptersStatus} subjectIcon={subjectIcon} />
          ) : (
            <DashboardGrid 
              status={status}
              subjectIcon={subjectIcon}
              simulations={simulations}
              isFetchingNextPage={isFetchingNextPage}
              lastElementRef={lastElementRef}
            />
          )}
        </div>
      </div>
    </div>
  );
}