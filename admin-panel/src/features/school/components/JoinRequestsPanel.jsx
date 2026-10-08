import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Check, CheckCheck, Clock, Loader2, X } from 'lucide-react';
import { useDecideJoinRequests, useSectionJoinRequests } from '../hooks/useStudentJoining';
import { translateError } from '../../../i18n/errors';
import { formatDate, inputClass, primaryButtonClass, secondaryButtonClass, dangerButtonClass } from '../utils/school';

// Students waiting to join a section (Phase 5g). A request that matches the
// class list (by its slip, or by roll number) says so; the teacher still
// decides. Nothing here lets a student in without a teacher's or admin's click.
export default function JoinRequestsPanel({ sectionId }) {
  const { t } = useTranslation('school');
  const { data: requests = [], isLoading } = useSectionJoinRequests(sectionId);
  const decide = useDecideJoinRequests();
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');

  const matched = requests.filter(r => r.class_list_entry_id);
  const run = (ids, approve, why = null, done) => decide.mutate({ ids, approve, reason: why }, {
    onSuccess: (count) => {
      toast.success(t(approve ? 'requests.approved' : 'requests.rejected', { count }));
      done?.();
    },
    onError: (err) => toast.error(translateError(err, t, 'requests.failed')),
  });

  if (isLoading) return <Loader2 className="w-4 h-4 animate-spin text-slate-400" />;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
          <Clock className="w-4 h-4 text-amber-500" /> {t('requests.title', { count: requests.length })}
        </h3>
        {matched.length > 1 && (
          <button type="button" disabled={decide.isPending} onClick={() => run(matched.map(r => r.id), true)}
            className={`ms-auto ${primaryButtonClass} py-1.5 text-xs`}>
            <CheckCheck className="w-3.5 h-3.5" /> {t('requests.approveMatched', { count: matched.length })}
          </button>
        )}
      </div>
      {requests.length === 0 ? (
        <p className="text-xs text-slate-400">{t('requests.none')}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {requests.map(r => {
            const entry = r.class_list_entries;
            return (
              <li key={r.id} className="py-2 space-y-1.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-sm font-medium text-slate-800"><bdi>{r.full_name}</bdi></span>
                  <span className="text-xs text-slate-500">{t('requests.roll', { roll: r.roll_number })}</span>
                  {entry ? (
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                      {t(r.from_slip ? 'requests.matchedSlip' : 'requests.matched', { name: entry.full_name, roll: entry.roll_number })}
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{t('requests.notOnList')}</span>
                  )}
                  <span className="text-xs text-slate-400">{formatDate(r.created_at)}</span>
                  <span className="ms-auto flex gap-1">
                    <button type="button" disabled={decide.isPending} onClick={() => run([r.id], true)} className={secondaryButtonClass}>
                      <Check className="w-3.5 h-3.5" /> {t('requests.approve')}
                    </button>
                    <button type="button" disabled={decide.isPending} onClick={() => { setRejecting(r.id); setReason(''); }} className={dangerButtonClass}>
                      <X className="w-3.5 h-3.5" /> {t('requests.reject')}
                    </button>
                  </span>
                </div>
                {rejecting === r.id && (
                  <form className="flex flex-wrap gap-2" onSubmit={(e) => {
                    e.preventDefault();
                    run([r.id], false, reason.trim() || null, () => setRejecting(null));
                  }}>
                    <input type="text" dir="auto" maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)}
                      placeholder={t('requests.reasonPlaceholder')} aria-label={t('requests.reasonPlaceholder')}
                      className={`${inputClass} flex-1 min-w-48 py-1.5`} />
                    <button type="submit" disabled={decide.isPending} className={dangerButtonClass}>{t('requests.confirmReject')}</button>
                    <button type="button" onClick={() => setRejecting(null)} className={secondaryButtonClass}>{t('common:actions.cancel')}</button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
