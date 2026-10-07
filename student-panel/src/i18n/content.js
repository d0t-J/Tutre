import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { useAuth } from '../features/auth';

// Urdu versions of curriculum text (Phase 3c). English stays in the curriculum
// tables and is always the fallback. Students only ever receive verified
// translations (RLS on content_translations), so anything returned can be shown.

// All short texts in one request: class, subject, chapter and topic names, and
// chapter descriptions. Topic descriptions and study guides are long and are
// fetched per topic by useTopicTranslation.
export function useContentText() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const urdu = i18n.language === 'ur';

  const { data } = useQuery({
    queryKey: ['content-text', 'ur'],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('content_translations')
        .select('entity_type, entity_id, field, text')
        .eq('language', 'ur')
        .or('entity_type.neq.topic,field.eq.name');
      if (error) throw new Error(error.message);
      return Object.fromEntries(rows.map(r => [`${r.entity_type}:${r.entity_id}:${r.field}`, r.text]));
    },
    enabled: !!user && urdu,
    staleTime: 1000 * 60 * 30,
  });

  // text('chapter', chapter.id, chapter.name) or text('chapter', id, english, 'description')
  return useCallback(
    (type, id, english, field = 'name') => (urdu && id && data?.[`${type}:${id}:${field}`]) || english,
    [urdu, data]
  );
}

// The Urdu description and study guide of one topic, when verified ones exist.
export function useTopicTranslation(topicId) {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const urdu = i18n.language === 'ur';

  const { data } = useQuery({
    queryKey: ['topic-text', 'ur', topicId],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('content_translations')
        .select('field, text')
        .eq('language', 'ur')
        .eq('entity_type', 'topic')
        .eq('entity_id', topicId)
        .in('field', ['description', 'study_guide']);
      if (error) throw new Error(error.message);
      return Object.fromEntries(rows.map(r => [r.field, r.text]));
    },
    enabled: !!user && urdu && !!topicId,
    staleTime: 1000 * 60 * 30,
  });

  return urdu ? (data ?? {}) : {};
}
