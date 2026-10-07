import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';

// Teachers' own simulations and notes (Phase 5c/5d). The database decides who
// may read, edit, share and copy what (migration 20261010090000); these hooks
// only call it. Material never touches the simulations or topics tables.

// Everything except the content, which can be large.
const LIST_COLUMNS = `id, org_id, owner_id, kind, chapter_id, topic_id, title, language, visibility, status,
  version, updated_at, based_on_simulation_id, based_on_topic_id, based_on_material_id,
  chapters(name, chapter_no, subjects(name, classes(name))),
  topic:topics!teacher_materials_topic_id_fkey(name), material_shares(section_id)`;

const requireRows = (data) => {
  if (!data || data.length === 0) throw new Error("You don't have permission to do that.");
  return data;
};

// "Class 9 · Computer Science · Ch 2 Logic Gates"
export const chapterPath = (chapter) => {
  if (!chapter) return '';
  const subject = chapter.subjects;
  return [subject?.classes?.name, subject?.name, `Ch ${chapter.chapter_no} ${chapter.name}`].filter(Boolean).join(' · ');
};

export const useMyMaterials = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['materials', 'mine', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_materials')
        .select(LIST_COLUMNS)
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user,
  });
};

// All material of one school, for its school admins (archive and unshare).
export const useSchoolMaterials = (orgId) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['materials', 'school', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_materials')
        .select(LIST_COLUMNS)
        .eq('org_id', orgId)
        .order('updated_at', { ascending: false });
      if (error) throw new Error(error.message);
      // School admins can read the names of their school's members.
      const ownerIds = [...new Set(data.map(m => m.owner_id).filter(Boolean))];
      if (ownerIds.length === 0) return data;
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', ownerIds);
      if (profileError) throw new Error(profileError.message);
      const names = Object.fromEntries(profiles.map(p => [p.id, p.display_name]));
      return data.map(m => ({ ...m, ownerName: names[m.owner_id] ?? null }));
    },
    enabled: !!user && !!orgId,
  });
};

export const useMaterial = (id) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['materials', 'one', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_materials')
        .select(`id, org_id, owner_id, kind, chapter_id, topic_id, title, summary, content, language, visibility,
          status, version, updated_at, based_on_simulation_id, based_on_topic_id, based_on_material_id,
          chapters(id, name, chapter_no, subject_id, subjects(id, name, class_id, classes(id, name))),
          material_shares(section_id)`)
        .eq('id', id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user && !!id,
  });
};

// Other teachers' material their school shares in its library.
export const useSchoolLibrary = (orgId) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['materials', 'library', orgId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('school_library', { p_org: orgId });
      if (error) throw new Error(error.message);
      const chapterIds = [...new Set(data.map(m => m.chapter_id))];
      if (chapterIds.length === 0) return [];
      const { data: chapters, error: chapterError } = await supabase
        .from('chapters')
        .select('id, name, chapter_no, subjects(name, classes(name))')
        .in('id', chapterIds);
      if (chapterError) throw new Error(chapterError.message);
      const byId = Object.fromEntries(chapters.map(c => [c.id, c]));
      return data.map(m => ({ ...m, chapters: byId[m.chapter_id] }));
    },
    enabled: !!user && !!orgId,
  });
};

// Tutre's published simulations for one chapter, to copy.
export const useTutreLibrary = (chapterId) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['materials', 'tutre', chapterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('all_simulations')
        .select('sim_id, topic_id, topic, kind')
        .eq('chapter_id', chapterId)
        .eq('status', 'published')
        .order('topic');
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user && !!chapterId,
  });
};

// The sections a material can be shared with: those the user teaches in the
// material's school, or every active section of it for a school admin.
export const useShareableSections = (orgId) => {
  const { user, sections, adminOrgs } = useAuth();
  const isAdminHere = adminOrgs.some(o => o.id === orgId);
  return useQuery({
    queryKey: ['materials', 'sections', orgId, isAdminHere],
    queryFn: async () => {
      if (!isAdminHere) {
        return sections
          .filter(s => s.org_id === orgId && s.role === 'teacher')
          .map(s => ({ id: s.section_id, name: s.name }));
      }
      const { data, error } = await supabase
        .from('sections')
        .select('id, name')
        .eq('org_id', orgId)
        .eq('archived', false)
        .order('name');
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user && !!orgId,
  });
};

const useMaterialMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materials'] }),
  });
};

const EDITABLE = ['chapter_id', 'topic_id', 'title', 'summary', 'content', 'language', 'visibility'];
const pick = (values, keys) => Object.fromEntries(keys.filter(k => k in values).map(k => [k, values[k]]));

// Creates material (with org_id and kind) or saves changes to it. Returns its id.
export const useSaveMaterial = () =>
  useMaterialMutation(async ({ id, values }) => {
    if (id) {
      const { data, error } = await supabase
        .from('teacher_materials')
        .update(pick(values, EDITABLE))
        .eq('id', id)
        .select('id');
      if (error) throw new Error(error.message);
      return requireRows(data)[0].id;
    }
    const { data, error } = await supabase
      .from('teacher_materials')
      .insert(pick(values, ['org_id', 'kind', ...EDITABLE]))
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return data.id;
  });

export const useSetMaterialStatus = () =>
  useMaterialMutation(async ({ id, status }) => {
    const { data, error } = await supabase.from('teacher_materials').update({ status }).eq('id', id).select('id');
    if (error) throw new Error(error.message);
    requireRows(data);
  });

export const useDeleteMaterial = () =>
  useMaterialMutation(async (id) => {
    const { data, error } = await supabase.from('teacher_materials').delete().eq('id', id).select('id');
    if (error) throw new Error(error.message);
    requireRows(data);
  });

// Replaces the set of sections a material is shared with.
export const useSetShares = () =>
  useMaterialMutation(async ({ id, current, next }) => {
    const add = next.filter(s => !current.includes(s));
    const remove = current.filter(s => !next.includes(s));
    if (add.length > 0) {
      const { error } = await supabase
        .from('material_shares')
        .insert(add.map(sectionId => ({ material_id: id, section_id: sectionId })));
      if (error) throw new Error(error.message);
    }
    if (remove.length > 0) {
      const { error } = await supabase
        .from('material_shares')
        .delete()
        .eq('material_id', id)
        .in('section_id', remove);
      if (error) throw new Error(error.message);
    }
  });

const rpc = async (name, args) => {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(error.message);
  return data;
};

export const useCopyTutreSimulation = () =>
  useMaterialMutation(({ simulationId, orgId }) =>
    rpc('copy_library_simulation', { p_simulation: simulationId, p_org: orgId }));

export const useCopyTutreNotes = () =>
  useMaterialMutation(({ topicId, orgId }) => rpc('copy_library_notes', { p_topic: topicId, p_org: orgId }));

export const useCopyMaterial = () =>
  useMaterialMutation((id) => rpc('copy_teacher_material', { p_material: id }));
