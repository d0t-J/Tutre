import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';

export const useSubjects = (classId) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['subjects', classId],
    queryFn: async () => {
      let query = supabase.from('subjects').select('*').order('name');
      if (classId) {
        query = query.eq('class_id', classId);
      }
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 60,
  });
};

export const useCreateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newSubject) => {
      const { data, error } = await supabase.from('subjects').insert([newSubject]).select();
      if (error) throw new Error(error.message);
      return data[0];
    },
    onSuccess: (_data, variables) => {
      const classId = variables?.class_id;
      return queryClient.invalidateQueries({
        queryKey: classId ? ['subjects', classId] : ['subjects'],
      });
    },
  });
};

export const useUpdateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase.from('subjects').update(updates).eq('id', id).select();
      if (error) throw new Error(error.message);
      return data[0];
    },
    onSuccess: (_data, variables) => {
      const classId = variables?.class_id;
      return queryClient.invalidateQueries({
        queryKey: classId ? ['subjects', classId] : ['subjects'],
      });
    },
  });
};

export const useDeleteSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('subjects').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
};
