import { useMemo } from 'react';

export function useBreadcrumbs({ 
  classSlug, subjectSlug, chapterSlug, 
  activeClass, matchedSubject, matchedChapter 
}) {
  return useMemo(() => {
    const breadcrumbs = [];
    if (activeClass?.name) breadcrumbs.push({ label: activeClass.name, path: `/class/${classSlug}` });
    if (matchedSubject?.name) breadcrumbs.push({ label: matchedSubject.name, path: `/class/${classSlug}/subject/${subjectSlug}` });
    if (matchedChapter?.name) breadcrumbs.push({ label: matchedChapter.name, path: `/class/${classSlug}/subject/${subjectSlug}/chapter/${chapterSlug}` });
    return breadcrumbs;
  }, [classSlug, subjectSlug, chapterSlug, activeClass, matchedSubject, matchedChapter]);
}
