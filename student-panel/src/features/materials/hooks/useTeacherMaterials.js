import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../auth';

// Simulations and notes the student's teachers shared with their sections
// (Phase 5e). shared_materials() returns only material shared with the
// caller, with the teacher's name; the content is read by id under RLS.

export const useSharedMaterials = (chapterId) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['shared-materials', user?.id, chapterId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('shared_materials', { p_chapter: chapterId });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user && !!chapterId,
  });
};

// One shared material with its content and the teacher's name, or null.
export const useSharedMaterial = (id) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['shared-material', user?.id, id],
    queryFn: async () => {
      const [info, row] = await Promise.all([
        supabase.rpc('shared_materials', { p_material: id }),
        supabase
          .from('teacher_materials')
          .select('id, kind, title, summary, content, language, chapter_id, topic_id, chapters(name, subjects(id, name, icon_name, classes(name)))')
          .eq('id', id)
          .maybeSingle(),
      ]);
      if (info.error) throw new Error(info.error.message);
      if (row.error) throw new Error(row.error.message);
      if (!row.data) return null;
      return { ...row.data, ownerName: info.data?.[0]?.owner_name ?? null };
    },
    enabled: !!user && !!id,
  });
};

// A teacher's simulation in the same shape as a Tutre simulation
// (useFetchSimulation), so the same viewer can show it.
export const toViewerSource = (material) => ({
  sim_id: material.id,
  topic: material.title,
  topic_id: material.topic_id,
  description: material.summary,
  code_payload: material.content,
  study_guide: null,
  subject: material.chapters?.subjects?.name ?? '',
  subject_id: material.chapters?.subjects?.id ?? null,
  icon_name: material.chapters?.subjects?.icon_name ?? null,
  class_name: material.chapters?.subjects?.classes?.name ?? '',
  chapter_id: material.chapter_id,
  language: material.language,
  teacherName: material.ownerName,
  isTeacherMaterial: true,
});
