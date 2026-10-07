import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../services/supabase';
import { useClasses } from '../../simulations/hooks/useClassQueries';
import { useSubjects } from '../../simulations/hooks/useSubjectQueries';
import { useChapters } from '../../simulations/hooks/useChapterQueries';
import { inputClass, labelClass } from '../../school/utils/school';

const useTopics = (chapterId) =>
  useQuery({
    queryKey: ['topics-of-chapter', chapterId],
    queryFn: async () => {
      const { data, error } = await supabase.from('topics').select('id, name').eq('chapter_id', chapterId).order('name');
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!chapterId,
    staleTime: 1000 * 60 * 10,
  });

// Class → subject → chapter (→ topic). value is { classId, subjectId,
// chapterId, topicId }; changing a level clears the levels below it.
export default function CurriculumPicker({ value, onChange, showTopic = true, disabled = false, idPrefix = 'curriculum' }) {
  const { t } = useTranslation('classroom');
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects(value.classId || undefined);
  const { data: chapters = [] } = useChapters(value.subjectId || undefined);
  const { data: topics = [] } = useTopics(value.chapterId);

  const field = (key, label, options, render, reset, optional = false) => (
    <div className="min-w-40 flex-1">
      <label htmlFor={`${idPrefix}-${key}`} className={labelClass}>{label}</label>
      <select
        id={`${idPrefix}-${key}`}
        value={value[key] ?? ''}
        disabled={disabled}
        onChange={(e) => onChange({ ...value, ...reset, [key]: e.target.value || null })}
        className={inputClass}
      >
        <option value="">{optional ? t('picker.anyTopic') : t('picker.choose')}</option>
        {options.map(o => <option key={o.id} value={o.id}>{render(o)}</option>)}
      </select>
    </div>
  );

  return (
    <div className="flex flex-wrap gap-3">
      {field('classId', t('picker.class'), classes, c => c.name, { subjectId: null, chapterId: null, topicId: null })}
      {field('subjectId', t('picker.subject'), value.classId ? subjects : [], s => s.name, { chapterId: null, topicId: null })}
      {field('chapterId', t('picker.chapter'), value.subjectId ? chapters : [], c => `${c.chapter_no}. ${c.name}`, { topicId: null })}
      {showTopic && field('topicId', t('picker.topic'), value.chapterId ? topics : [], tp => tp.name, {}, true)}
    </div>
  );
}
