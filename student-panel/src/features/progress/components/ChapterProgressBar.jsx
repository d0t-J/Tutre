import { useTranslation } from 'react-i18next';

// How far the student is through a chapter's simulations: the bar fills with
// explored topics, darker for practised and mastered ones.
export default function ChapterProgressBar({ progress }) {
  const { t } = useTranslation('progress');
  if (!progress || progress.total === 0) return null;
  const pct = (n) => `${(n / progress.total) * 100}%`;

  return (
    <div className="w-full mt-2" title={t('chapter.detail', progress)}>
      <div className="relative h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className="absolute inset-y-0 start-0 bg-sky-200" style={{ width: pct(progress.explored) }} />
        <div className="absolute inset-y-0 start-0 bg-amber-300" style={{ width: pct(progress.practised) }} />
        <div className="absolute inset-y-0 start-0 bg-emerald-500" style={{ width: pct(progress.mastered) }} />
      </div>
      <p className="mt-1 text-[10px] text-slate-400">{t('chapter.summary', { done: progress.explored, total: progress.total })}</p>
    </div>
  );
}
