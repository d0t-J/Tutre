import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../services/supabase';
import { slugify } from '../../../utils/slugify';
import { useSimulations } from '../../simulations/hooks/useSimulations';
import { useSubjects } from '../../simulations/hooks/useSubjects';
import { useChapters } from '../../simulations/hooks/useChapters';
import { useBreadcrumbs } from './useBreadcrumbs';
import { useSubjectIcon } from './useSubjectIcon';

export function useDashboardState() {
  const { classSlug, subjectSlug, chapterSlug } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [classes, setClasses] = useState([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const observer = useRef();
  
  useEffect(() => {
    async function fetchClasses() {
      setIsLoadingClasses(true);
      const { data } = await supabase.from('classes').select('*').order('name');
      if (data) {
        const sortedClasses = data.sort((a, b) => 
          a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
        );
        setClasses(sortedClasses);
      }
      setIsLoadingClasses(false);
    }
    fetchClasses();
  }, []);

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
    status, subjectIcon, simulations, isFetchingNextPage, lastElementRef, breadcrumbs
  };
}
