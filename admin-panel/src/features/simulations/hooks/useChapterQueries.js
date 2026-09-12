import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';

export const useChapters = (subjectId) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['chapters', subjectId],
    queryFn: async () => {
      let query = supabase.from('chapters').select('*').order('chapter_no', { ascending: true }).order('name');
      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      }
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 60,
  });
};

export const useCreateChapter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newChapter) => {
      const { data, error } = await supabase.from('chapters').insert([newChapter]).select();
      if (error) throw new Error(error.message);
      return data[0];
    },
    onSuccess: (_data, variables) => {
      const subjectId = variables?.subject_id;
      return queryClient.invalidateQueries({
        queryKey: subjectId ? ['chapters', subjectId] : ['chapters'],
      });
    },
  });
};

export const useUpdateChapter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase.from('chapters').update(updates).eq('id', id).select();
      if (error) throw new Error(error.message);
      return data[0];
    },
    onSuccess: (_data, variables) => {
      const subjectId = variables?.subject_id;
      return queryClient.invalidateQueries({
        queryKey: subjectId ? ['chapters', subjectId] : ['chapters'],
      });
    },
  });
};

export const useDeleteChapter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('chapters').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ['chapters'] });
    },
  });
};
