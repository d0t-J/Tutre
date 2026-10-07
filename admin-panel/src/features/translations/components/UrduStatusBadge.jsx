import { useNavigate } from 'react-router-dom';
import { Languages } from 'lucide-react';

// A simulation card's Urdu readiness: how many of its topic's texts (name,
// description, study guide) have a verified, up-to-date Urdu translation.
// Clicking opens the Translations page filtered to that topic.
export default function UrduStatusBadge({ topicId, status }) {
  const navigate = useNavigate();
  if (!topicId || !status) return null;

  const { verified, total } = status;
  const ready = total > 0 && verified === total;
  const style = ready
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
    : verified > 0
      ? 'bg-amber-50 text-amber-700 border-amber-100'
      : 'bg-slate-50 text-slate-500 border-slate-200';

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); navigate(`/translations?topic=${topicId}`); }}
      title={ready ? 'Urdu is ready: every text is verified.' : `Urdu: ${verified} of ${total} texts verified. Click to review.`}
      className={`cursor-pointer shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold hover:brightness-95 ${style}`}
    >
      <Languages className="w-3 h-3" />
      {ready ? 'Urdu' : `Urdu ${verified}/${total}`}
    </button>
  );
}
