import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ClipboardList, KeyRound, Loader2, Plus, Printer, Trash2 } from 'lucide-react';
import { fetchSlipCode, parseClassList, useAddClassListEntries, useClassList, useRemoveClassListEntry } from '../hooks/useStudentJoining';
import { translateError } from '../../../i18n/errors';
import { formatCode, inputClass, labelClass, primaryButtonClass, secondaryButtonClass, dangerButtonClass } from '../utils/school';

// A section's class list (Phase 5g): the students the school expects, by roll
// number and name. Requests that match it are marked for the teacher, and each
// entry can get a personal one-time slip code to print and hand out.
export default function ClassListPanel({ sectionId }) {
  const { t } = useTranslation('school');
  const { data: entries = [], isLoading } = useClassList(sectionId);
  const add = useAddClassListEntries();
  const remove = useRemoveClassListEntry();
  const [roll, setRoll] = useState('');
  const [name, setName] = useState('');
  const [pasting, setPasting] = useState(false);
  const [pasted, setPasted] = useState('');
  const [slips, setSlips] = useState({});

  const addEntries = (list, done) => add.mutate({ sectionId, entries: list }, {
    onSuccess: () => { toast.success(t('classList.added', { count: list.length })); done?.(); },
    onError: (err) => toast.error(translateError(err, t, 'classList.addFailed')),
  });

  const handleAdd = (e) => {
    e.preventDefault();
    addEntries([{ rollNumber: roll.trim(), fullName: name.trim() }], () => { setRoll(''); setName(''); });
  };

  const handlePaste = () => {
    const { entries: list, rejected } = parseClassList(pasted);
    if (rejected.length > 0) {
      toast.error(t('classList.pasteRejected', { count: rejected.length, line: rejected[0] }));
      return;
    }
    if (list.length === 0) return;
    addEntries(list, () => { setPasted(''); setPasting(false); });
  };

  const showSlip = async (entry) => {
    try {
      const slip = await fetchSlipCode(entry.id);
      setSlips(prev => ({ ...prev, [entry.id]: slip.code }));
    } catch (err) {
      toast.error(translateError(err, t, 'classList.slipFailed'));
    }
  };

  const joined = entries.filter(e => e.student_id).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
          <ClipboardList className="w-4 h-4 text-slate-400" /> {t('classList.title', { joined, count: entries.length })}
        </h3>
        {entries.length > joined && (
          <Link to={`/classroom/sections/${sectionId}/slips`} className={`ms-auto ${secondaryButtonClass}`}>
            <Printer className="w-3.5 h-3.5" /> {t('classList.printSlips')}
          </Link>
        )}
      </div>
      <p className="text-xs text-slate-400">{t('classList.note')}</p>

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
        <div className="w-28">
          <label htmlFor={`roll-${sectionId}`} className={labelClass}>{t('classList.roll')}</label>
          <input id={`roll-${sectionId}`} type="text" dir="ltr" required maxLength={30} value={roll}
            onChange={(e) => setRoll(e.target.value)} className={`${inputClass} py-1.5`} />
        </div>
        <div className="flex-1 min-w-48">
          <label htmlFor={`name-${sectionId}`} className={labelClass}>{t('classList.name')}</label>
          <input id={`name-${sectionId}`} type="text" dir="auto" required minLength={2} maxLength={120} value={name}
            onChange={(e) => setName(e.target.value)} className={`${inputClass} py-1.5`} />
        </div>
        <button type="submit" disabled={add.isPending || !roll.trim() || name.trim().length < 2} className={primaryButtonClass}>
          <Plus className="w-4 h-4" /> {t('classList.add')}
        </button>
        <button type="button" onClick={() => setPasting(v => !v)} className={secondaryButtonClass}>{t('classList.paste')}</button>
      </form>

      {pasting && (
        <div className="space-y-2">
          <textarea rows={6} dir="auto" value={pasted} onChange={(e) => setPasted(e.target.value)}
            placeholder={'12, Ali Khan\n13, Sara Ahmed'} aria-label={t('classList.pasteLabel')} className={inputClass} />
          <p className="text-xs text-slate-400">{t('classList.pasteHelp')}</p>
          <button type="button" onClick={handlePaste} disabled={add.isPending || !pasted.trim()} className={primaryButtonClass}>
            {add.isPending && <Loader2 className="w-4 h-4 animate-spin" />} {t('classList.addAll')}
          </button>
        </div>
      )}

      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
      ) : entries.length === 0 ? (
        <p className="text-xs text-slate-400">{t('classList.empty')}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {entries.map(entry => (
            <li key={entry.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
              <span className="w-12 text-xs font-mono text-slate-500" dir="ltr">{entry.roll_number}</span>
              <span className="text-sm text-slate-800"><bdi>{entry.full_name}</bdi></span>
              {entry.student_id ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {t('classList.joined')}
                </span>
              ) : slips[entry.id] ? (
                <code className="font-mono text-sm font-bold tracking-wider text-primary-700">{formatCode(slips[entry.id])}</code>
              ) : null}
              <span className="ms-auto flex gap-1">
                {!entry.student_id && !slips[entry.id] && (
                  <button type="button" onClick={() => showSlip(entry)} className={secondaryButtonClass}>
                    <KeyRound className="w-3.5 h-3.5" /> {t('classList.slip')}
                  </button>
                )}
                <button type="button" disabled={remove.isPending} aria-label={t('classList.remove', { name: entry.full_name })}
                  onClick={() => remove.mutate(entry.id, { onError: (err) => toast.error(translateError(err, t, 'classList.removeFailed')) })}
                  className={dangerButtonClass}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
