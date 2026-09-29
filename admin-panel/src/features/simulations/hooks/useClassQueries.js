import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';

export const useClasses = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('classes').select('*');
      if (error) throw new Error(error.message);
      return [...data].sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true }));
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 60,
  });
};

export const useCreateClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newClass) => {
      const { data, error } = await supabase.from('classes').insert([newClass]).select();
      if (error) throw new Error(error.message);
      return data[0];
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
};

export const useUpdateClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase.from('classes').update(updates).eq('id', id).select();
      if (error) throw new Error(error.message);
      return data[0];
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
};

export const useDeleteClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
};
