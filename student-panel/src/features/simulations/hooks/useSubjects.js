import { useQuery, useQueryClient } from '@tanstack/react-query';
import { classesQuery, subjectsOfClassQuery } from './curriculumQueries';
import { useAuth } from '../../auth';
import { slugify } from '../../../utils/slugify';

export const useSubjects = (classSlug) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['subjects', classSlug],
    queryFn: async () => {
      if (!classSlug) return [];

      const classes = await queryClient.fetchQuery(classesQuery);
      const classData = classes.find(c => slugify(c.name) === classSlug);
      if (!classData) throw new Error('Class not found');

      const data = await queryClient.fetchQuery(subjectsOfClassQuery(classData.id));
      return data.map(sub => ({ ...sub, className: classData.name }));
    },
    enabled: !!user && !!classSlug,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
