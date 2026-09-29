import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';

export const useSimulations = (page, pageSize = 20, subjectId, classId, searchQuery, chapterId) => {
  return useQuery({
    queryKey: ['admin-simulations', page, subjectId, classId, searchQuery, chapterId],
    queryFn: async () => {
      let query = supabase
        .from('all_simulations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (subjectId) {
        query = query.eq('subject_id', subjectId);
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

      return {
        data,
        count,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    },
    keepPreviousData: true,
  });
};
