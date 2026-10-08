import { supabase } from '../../../services/supabase';

// The class list and each class's subjects change rarely but were fetched again
// by every page and hook that needed them (navbar, dashboard, subjects,
// chapters, simulations, profile). These shared query definitions let React
// Query fetch each once and serve the cached copy: use them with useQuery, or
// with queryClient.fetchQuery inside another query.

const HOUR = 60 * 60 * 1000;

const byName = (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });

export const classesQuery = {
  queryKey: ['curriculum', 'classes'],
  queryFn: async () => {
    const { data, error } = await supabase.from('classes').select('*');
    if (error) throw new Error(error.message);
    return [...data].sort(byName);
  },
  staleTime: HOUR,
};

export const subjectsOfClassQuery = (classId) => ({
  queryKey: ['curriculum', 'subjects', classId],
  queryFn: async () => {
    const { data, error } = await supabase.from('subjects').select('*').eq('class_id', classId).order('name');
    if (error) throw new Error(error.message);
    return data;
  },
  staleTime: HOUR,
});
