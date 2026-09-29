import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../auth';
import { slugify } from '../../../utils/slugify';

export const useSubjects = (classSlug) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['subjects', classSlug],
    queryFn: async () => {
      if (!classSlug) return [];

      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('id, name');
        
      if (classError || !classes) {
        throw new Error(classError?.message || 'Class not found');
      }

      const classData = classes.find(c => slugify(c.name) === classSlug);
      if (!classData) throw new Error('Class not found');

      // Then fetch subjects for that class ID
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('class_id', classData.id)
        .order('name');
        
      if (error) throw new Error(error.message);
      
      return data.map(sub => ({ ...sub, className: classData.name }));
    },
    enabled: !!user && !!classSlug,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
