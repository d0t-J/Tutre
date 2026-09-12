import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { slugify } from '../../../utils/slugify';

export const useSimulations = (pageSize = 20, classSlug, subjectSlug, searchQuery, chapterId) => {
  return useInfiniteQuery({
    queryKey: ['simulations', classSlug, subjectSlug, searchQuery, chapterId],
    queryFn: async ({ pageParam = 1 }) => {
      let classId = null;
      let subjectId = null;

      // 1. Resolve Class ID if classSlug is provided
      if (classSlug) {
        const { data: classes } = await supabase.from('classes').select('id, name');
        if (classes) {
          const matchedClass = classes.find(c => slugify(c.name) === classSlug);
          if (matchedClass) classId = matchedClass.id;
        }
      }

      // 2. Resolve Subject ID if subjectSlug is provided (and class is known)
      if (subjectSlug && classId) {
        const { data: subjects } = await supabase.from('subjects').select('id, name').eq('class_id', classId);
        if (subjects) {
          const matchedSubject = subjects.find(s => slugify(s.name) === subjectSlug);
          if (matchedSubject) subjectId = matchedSubject.id;
        }
      }

      // 3. Query all_simulations
      let query = supabase
        .from('all_simulations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((pageParam - 1) * pageSize, pageParam * pageSize - 1);

      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      } else if (subjectSlug) {
        // Fallback to text match if ID resolution failed for some reason
        query = query.eq('subject', subjectSlug);
      }

      if (classId) {
        query = query.eq('class_id', classId);
      }

      if (chapterId) {
        query = query.eq('chapter_id', chapterId);
      }

      if (searchQuery) {
        query = query.or(`topic.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      const totalPages = Math.ceil((count || 0) / pageSize);
      return {
        data: data || [],
        nextPage: pageParam < totalPages ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });
};
