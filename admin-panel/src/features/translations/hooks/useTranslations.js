import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';
import { functionHeaders, functionError } from '../../../services/edgeFunctions';

// Urdu translations of the curriculum (Phase 3c). The database enforces the
// review workflow: authors write drafts, reviewers and platform admins verify
// (supabase/migrations/20261007090000_content_translations.sql).

const TYPE_ORDER = { class: 0, subject: 1, chapter: 2, topic: 3 };
const FIELD_ORDER = { name: 0, description: 1, study_guide: 2 };

// Missing, draft, verified, or outdated (verified or draft, but the English
// changed after it was translated).
export const rowState = (row) => {
  if (!row.translation_id) return 'missing';
  if (row.outdated) return 'outdated';
  return row.status;
};

const requireRows = (data) => {
  if (!data || data.length === 0) throw new Error("You don't have permission to do that.");
  return data;
};

// Every translatable field in the chosen part of the curriculum.
export const useTranslationOverview = ({ classId, subjectId, chapterId, field }) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['translation-overview', classId || null, subjectId || null, chapterId || null, field || null],
    queryFn: async () => {
      let query = supabase.from('translation_overview').select('*');
      if (chapterId) query = query.eq('chapter_id', chapterId);
      else if (subjectId) query = query.eq('subject_id', subjectId);
      else if (classId) query = query.eq('class_id', classId);
      if (field) query = query.eq('field', field);
      const { data, error } = await query.limit(5000);
      if (error) throw new Error(error.message);
      return data.sort((a, b) =>
        TYPE_ORDER[a.entity_type] - TYPE_ORDER[b.entity_type]
        || a.chapter_no - b.chapter_no
        || a.english.localeCompare(b.english, undefined, { numeric: true })
        || FIELD_ORDER[a.field] - FIELD_ORDER[b.field]);
    },
    enabled: !!user,
  });
};

const useTranslationMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['translation-overview'] }),
  });
};

// Creates or updates the Urdu text of one row, with the given status.
export const useSaveTranslation = () =>
  useTranslationMutation(async ({ row, text, status }) => {
    if (row.translation_id) {
      const { data, error } = await supabase
        .from('content_translations')
        .update({ text, status, source: 'human' })
        .eq('id', row.translation_id)
        .select('id');
      if (error) throw new Error(error.message);
      requireRows(data);
      return;
    }
    const { error } = await supabase.from('content_translations').insert({
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      field: row.field,
      language: 'ur',
      text,
      status,
      source: 'human',
    });
    if (error) throw new Error(error.message);
  });

export const useSetTranslationStatus = () =>
  useTranslationMutation(async ({ id, status }) => {
    const { data, error } = await supabase
      .from('content_translations')
      .update({ status })
      .eq('id', id)
      .select('id');
    if (error) throw new Error(error.message);
    requireRows(data);
  });

export const useDeleteTranslation = () =>
  useTranslationMutation(async (id) => {
    const { data, error } = await supabase.from('content_translations').delete().eq('id', id).select('id');
    if (error) throw new Error(error.message);
    requireRows(data);
  });

// Asks translate-content for an AI draft of one row. Saved as a draft by the
// function; counts against the 300-per-day translation limit.
export const draftWithAI = async (row) => {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-content`, {
    method: 'POST',
    headers: await functionHeaders(),
    body: JSON.stringify({ entity_type: row.entity_type, entity_id: row.entity_id, field: row.field }),
  });
  if (!response.ok) throw await functionError(response, 'Could not draft a translation.');
  return response.json();
};

export const useDraftWithAI = () => useTranslationMutation(draftWithAI);

// ---------------------------------------------------------------------------
// Glossary
// ---------------------------------------------------------------------------
export const useGlossary = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['glossary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('glossary_terms')
        .select('id, subject_slug, term_en, term_ur, roman_ur, notes, status, edited_by, updated_at')
        .order('term_en');
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user,
  });
};

const useGlossaryMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['glossary'] }),
  });
};

export const useSaveTerm = () =>
  useGlossaryMutation(async ({ id, values }) => {
    const { data, error } = id
      ? await supabase.from('glossary_terms').update(values).eq('id', id).select('id')
      : await supabase.from('glossary_terms').insert(values).select('id');
    if (error) throw new Error(error.message);
    requireRows(data);
  });

export const useDeleteTerm = () =>
  useGlossaryMutation(async (id) => {
    const { data, error } = await supabase.from('glossary_terms').delete().eq('id', id).select('id');
    if (error) throw new Error(error.message);
    requireRows(data);
  });
