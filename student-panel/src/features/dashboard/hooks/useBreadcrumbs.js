import { useMemo } from 'react';

export function useBreadcrumbs({ 
  classSlug, subjectSlug, chapterSlug, 
  activeClass, matchedSubject, matchedChapter 
}) {
  return useMemo(() => {
    const breadcrumbs = [];
    if (activeClass?.name) breadcrumbs.push({ type: 'class', id: activeClass.id, label: activeClass.name, path: `/class/${classSlug}` });
    if (matchedSubject?.name) breadcrumbs.push({ type: 'subject', id: matchedSubject.id, label: matchedSubject.name, path: `/class/${classSlug}/subject/${subjectSlug}` });
    if (matchedChapter?.name) breadcrumbs.push({ type: 'chapter', id: matchedChapter.id, label: matchedChapter.name, path: `/class/${classSlug}/subject/${subjectSlug}/chapter/${chapterSlug}` });
    return breadcrumbs;
  }, [classSlug, subjectSlug, chapterSlug, activeClass, matchedSubject, matchedChapter]);
}
