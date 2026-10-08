import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { slugify } from '../../../utils/slugify';
import { useSimulations } from '../../simulations/hooks/useSimulations';
import { useSubjects } from '../../simulations/hooks/useSubjects';
import { useChapters } from '../../simulations/hooks/useChapters';
import { classesQuery } from '../../simulations/hooks/curriculumQueries';
import { useBreadcrumbs } from './useBreadcrumbs';
import { useSubjectIcon } from './useSubjectIcon';

export function useDashboardState() {
  const { classSlug, subjectSlug, chapterSlug } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const observer = useRef();
  const { data: classes = [], isLoading: isLoadingClasses } = useQuery(classesQuery);

  const { data: subjectsData, status: subjectsStatus } = useSubjects(classSlug);
  const subjects = subjectsData || [];

  const { data: chaptersData, status: chaptersStatus } = useChapters(classSlug, subjectSlug);
  const chapters = chaptersData || [];

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const activeClass = classes.find(c => slugify(c.name) === classSlug);
  const matchedSubject = subjects.find(s => slugify(s.name) === subjectSlug);
  const matchedChapter = chapters.find(c => slugify(c.name) === chapterSlug);

  const { data, status, fetchNextPage, hasNextPage, isFetchingNextPage } = useSimulations(
    20, classSlug, subjectSlug, debouncedSearch, matchedChapter?.id
  );

  const lastElementRef = useCallback(node => {
    if (status === 'pending' || isFetchingNextPage) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
    }, { threshold: 0.1 });
    if (node) observer.current.observe(node);
  }, [status, isFetchingNextPage, hasNextPage, fetchNextPage]);

  const subjectIcon = useSubjectIcon(matchedSubject, classSlug);

  const breadcrumbs = useBreadcrumbs({
    classSlug, subjectSlug, chapterSlug, activeClass, matchedSubject, matchedChapter
  });

  const simulations = data ? data.pages.flatMap(page => page.data) : [];

  return {
    classSlug, subjectSlug, chapterSlug, searchQuery, setSearchQuery,
    classes, isLoadingClasses, subjects, subjectsStatus, chapters, chaptersStatus,
    status, subjectIcon, simulations, isFetchingNextPage, lastElementRef, breadcrumbs,
    chapterId: matchedChapter?.id ?? null,
  };
}
