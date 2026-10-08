import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { STUDENT_APP_URL } from '../../services/portals';
import { fetchSlipCode, useClassList } from '../../features/school/hooks/useStudentJoining';
import { formatCode, formatDate, primaryButtonClass } from '../../features/school/utils/school';

// Printable slips (Phase 5g): one per student on the class list who has not
// joined yet, with their personal one-time code, a join link and a QR code.
// The teacher cuts them out and hands them out in class.

function Slip({ entry, slip, section }) {
  const { t } = useTranslation('school');
  const link = STUDENT_APP_URL ? `${STUDENT_APP_URL}/join?code=${formatCode(slip.code)}` : null;
  const [qr, setQr] = useState(null);
  useEffect(() => {
    if (!link) return undefined;
    let cancelled = false;
    QRCode.toDataURL(link, { margin: 0, width: 110 }).then((url) => { if (!cancelled) setQr(url); });
    return () => { cancelled = true; };
  }, [link]);

  return (
    <div className="break-inside-avoid border-2 border-dashed border-slate-300 rounded-xl p-3 flex gap-3 items-center bg-white">
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500"><bdi>{section.organizations?.name} · {section.name}</bdi></p>
        <p className="text-sm font-extrabold text-slate-800"><bdi>{entry.full_name}</bdi> <span className="font-mono text-xs text-slate-500" dir="ltr">#{entry.roll_number}</span></p>
        <p className="font-mono text-xl font-extrabold tracking-wider text-slate-900" dir="ltr">{formatCode(slip.code)}</p>
        <p className="text-[10px] text-slate-500">{t('slips.howTo', { date: formatDate(slip.expires_at) })}</p>
        {link && <p className="text-[9px] text-slate-400 break-all" dir="ltr">{link}</p>}
      </div>
      {qr && <img src={qr} width={110} height={110} alt={t('slips.qrAlt', { name: entry.full_name })} />}
    </div>
  );
}

export default function SlipsPage() {
  const { t } = useTranslation('school');
  const { sectionId } = useParams();
  const { data: entries = [], isLoading: loadingEntries } = useClassList(sectionId);
  const { data: section } = useQuery({
    queryKey: ['section-with-school', sectionId],
    queryFn: async () => {
      const { data, error } = await supabase.from('sections').select('id, name, organizations(name)').eq('id', sectionId).single();
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const waiting = entries.filter(e => !e.student_id);
  const ids = waiting.map(e => e.id).join(',');

  // One slip code per entry, created on first use and reused after that.
  const { data: slips, isLoading: loadingSlips, error } = useQuery({
    queryKey: ['slips', sectionId, ids],
    queryFn: async () => {
      const result = {};
      for (const entry of waiting) result[entry.id] = await fetchSlipCode(entry.id);
      return result;
    },
    enabled: !loadingEntries && waiting.length > 0,
    staleTime: Infinity,
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 sm:p-0 space-y-4">
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <Link to="/classroom" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" /> {t('slips.back')}
          </Link>
          <button type="button" onClick={() => window.print()} disabled={!slips} className={`ms-auto ${primaryButtonClass}`}>
            <Printer className="w-4 h-4" /> {t('slips.print')}
          </button>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800 print:hidden">{t('slips.title', { section: section?.name ?? '' })}</h1>
        <p className="text-sm text-slate-500 print:hidden">{t('slips.note')}</p>
        {loadingEntries || loadingSlips ? (
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        ) : error ? (
          <p className="text-sm text-red-600">{t('classList.slipFailed')}</p>
        ) : waiting.length === 0 ? (
          <p className="text-sm text-slate-500">{t('slips.none')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-3">
            {section && waiting.map(entry => slips?.[entry.id] && (
              <Slip key={entry.id} entry={entry} slip={slips[entry.id]} section={section} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
