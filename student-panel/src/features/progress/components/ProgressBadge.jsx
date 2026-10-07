import { useTranslation } from 'react-i18next';
import { Award, Compass, Dumbbell } from 'lucide-react';

const STYLES = {
  explored: { className: 'bg-sky-50 text-sky-700 border-sky-100', Icon: Compass },
  practised: { className: 'bg-amber-50 text-amber-700 border-amber-100', Icon: Dumbbell },
  mastered: { className: 'bg-emerald-50 text-emerald-700 border-emerald-100', Icon: Award },
};

// A topic's learning level. Renders nothing for a topic not started yet.
export default function ProgressBadge({ level, className = '' }) {
  const { t } = useTranslation('progress');
  const style = STYLES[level];
  if (!style) return null;
  const { Icon } = style;
  return (
    <span
      title={t(`levels.${level}.hint`)}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold whitespace-nowrap ${style.className} ${className}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      {t(`levels.${level}.label`)}
    </span>
  );
}
