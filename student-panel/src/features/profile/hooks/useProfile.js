import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../auth';
import { classesQuery } from '../../simulations/hooks/curriculumQueries';

// The profiles row is created by a database trigger at sign-up. Its owner may
// change only display_name, preferred_language and class_id.
const PROFILE_COLUMNS = 'id, display_name, preferred_language, class_id, updated_at';

export const useProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(PROFILE_COLUMNS)
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user,
  });
};

export const useUpdateProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (changes) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(changes)
        .eq('id', user.id)
        .select(PROFILE_COLUMNS)
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', user.id], data);
    },
  });
};

export const useClassOptions = () => {
  const { user } = useAuth();

  // The shared, cached class list (simulations/hooks/curriculumQueries.js).
  return useQuery({ ...classesQuery, enabled: !!user });
};
