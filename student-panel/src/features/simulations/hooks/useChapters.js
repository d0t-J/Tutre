import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../auth';
import { slugify } from '../../../utils/slugify';

export const useChapters = (classSlug, subjectSlug) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['chapters', classSlug, subjectSlug],
    queryFn: async () => {
      if (!classSlug || !subjectSlug) return [];

      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('id, name');
        
      if (classError || !classes) {
        throw new Error(classError?.message || 'Class not found');
      }

      const classData = classes.find(c => slugify(c.name) === classSlug);
      if (!classData) throw new Error('Class not found');

      const { data: subjects, error: subjectError } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('class_id', classData.id);
        
      if (subjectError || !subjects) {
        throw new Error(subjectError?.message || 'Subject not found');
      }

      const subjectData = subjects.find(s => slugify(s.name) === subjectSlug);
      if (!subjectData) throw new Error('Subject not found');

      // Then fetch chapters for that subject ID
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('subject_id', subjectData.id)
        .order('chapter_no', { ascending: true })
        .order('name');
        
      if (error) throw new Error(error.message);
      return data.map(chap => ({ ...chap, className: classData.name, subjectName: subjectData.name }));
    },
    enabled: !!user && !!classSlug && !!subjectSlug,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
