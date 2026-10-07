import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../auth';
import { formatDate } from '../../../i18n';
import { useContentText } from '../../../i18n/content';
import { LEVELS, useMyProgress } from '../hooks/useProgress';
import ProgressBadge from './ProgressBadge';

const RECENT = 6;

// The profile's progress summary: how many topics at each level, and the
// topics the student moved forward on most recently.
export default function MyProgressCard() {
  const { t } = useTranslation('progress');
  const { user } = useAuth();
  const text = useContentText();
  const { data: progress = {}, isLoading } = useMyProgress();

  const rows = Object.values(progress).sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''));
  const recentIds = rows.slice(0, RECENT).map(r => r.topic_id);

  const { data: topicNames = {} } = useQuery({
    queryKey: ['progress-topic-names', recentIds.join(',')],
    queryFn: async () => {
      const { data, error } = await supabase.from('topics').select('id, name').in('id', recentIds);
      if (error) throw new Error(error.message);
      return Object.fromEntries(data.map(row => [row.id, row.name]));
    },
    enabled: !!user && recentIds.length > 0,
  });

  if (isLoading) return null;

  const counts = Object.fromEntries(LEVELS.map(level => [level, rows.filter(r => r.level === level).length]));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {LEVELS.map(level => (
          <div key={level} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <p className="text-2xl font-extrabold text-slate-800">{counts[level]}</p>
            <ProgressBadge level={level} />
          </div>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">{t('profile.none')}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.slice(0, RECENT).map(row => (
            <li key={row.topic_id} className="flex items-center gap-3 py-2">
              <span className="text-sm text-slate-800 min-w-0 truncate">
                <bdi>{text('topic', row.topic_id, topicNames[row.topic_id] ?? '…')}</bdi>
              </span>
              <span className="text-xs text-slate-400 shrink-0">{formatDate(row.updated_at)}</span>
              <ProgressBadge level={row.level} className="ms-auto" />
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-slate-400">{t('profile.note')}</p>
    </div>
  );
}
