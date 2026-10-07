import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Check, Copy, Link2, Loader2, QrCode, RefreshCw } from 'lucide-react';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { supabase } from '../../../services/supabase';
import { STUDENT_APP_URL } from '../../../services/portals';
import { translateError } from '../../../i18n/errors';
import { formatCode, formatDate, secondaryButtonClass } from '../utils/school';

// A section's standing class code (Phase 5f): one student code for the whole
// class, shared as a code, a link or a QR code, and replaced in one click.
const fetchClassCode = async (sectionId, replace = false) => {
  const { data, error } = await supabase.rpc('class_code', { p_section: sectionId, p_replace: replace });
  if (error) throw new Error(error.message);
  return data;
};

const joinLink = (code) => (STUDENT_APP_URL ? `${STUDENT_APP_URL}/join?code=${formatCode(code)}` : null);

function CopyButton({ text, label, icon: Icon }) {
  const { t } = useTranslation('school');
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t('codes.copyFailed'));
    }
  };
  return (
    <button type="button" onClick={copy} className={secondaryButtonClass}>
      {copied ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
      {copied ? t('codes.copied') : label}
    </button>
  );
}

function QrImage({ link, sectionName }) {
  const { t } = useTranslation('school');
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(link, { margin: 1, width: 220 }).then((url) => { if (!cancelled) setSrc(url); });
    return () => { cancelled = true; };
  }, [link]);
  if (!src) return <Loader2 className="w-4 h-4 animate-spin text-slate-400" />;
  return <img src={src} width={220} height={220} alt={t('classCode.qrAlt', { section: sectionName })} className="rounded-lg border border-slate-200" />;
}

export default function ClassCodeCard({ sectionId, sectionName }) {
  const { t } = useTranslation('school');
  const queryClient = useQueryClient();
  const [showQr, setShowQr] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const { data: code, isLoading, error } = useQuery({
    queryKey: ['class-code', sectionId],
    queryFn: () => fetchClassCode(sectionId),
    staleTime: 60 * 1000,
  });
  const replace = useMutation({
    mutationFn: () => fetchClassCode(sectionId, true),
    onSuccess: (data) => {
      queryClient.setQueryData(['class-code', sectionId], data);
      queryClient.invalidateQueries({ queryKey: ['teaching'] });
      queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      toast.success(t('classCode.replaced'));
      setConfirmReplace(false);
    },
    onError: (err) => toast.error(translateError(err, t, 'classCode.failed')),
  });

  if (isLoading) return <Loader2 className="w-4 h-4 animate-spin text-slate-400" />;
  if (error || !code) return <p className="text-xs text-red-600">{t('classCode.failed')}</p>;

  const link = joinLink(code.code);
  return (
    <div className="p-4 rounded-xl bg-primary-50/60 border border-primary-100 space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('classCode.title')}</span>
        <code className="font-mono text-xl font-extrabold tracking-wider text-primary-700">{formatCode(code.code)}</code>
        <span className="text-xs text-slate-500">
          {t('classCode.usage', { uses: code.uses, date: formatDate(code.expires_at) })}
        </span>
      </div>
      <p className="text-xs text-slate-500">{t('classCode.note')}</p>
      <div className="flex flex-wrap gap-1">
        <CopyButton text={formatCode(code.code)} label={t('classCode.copyCode')} icon={Copy} />
        {link && <CopyButton text={link} label={t('classCode.copyLink')} icon={Link2} />}
        {link && (
          <button type="button" onClick={() => setShowQr(v => !v)} className={secondaryButtonClass}>
            <QrCode className="w-3.5 h-3.5" /> {showQr ? t('classCode.hideQr') : t('classCode.showQr')}
          </button>
        )}
        <button type="button" onClick={() => setConfirmReplace(true)} disabled={replace.isPending} className={secondaryButtonClass}>
          <RefreshCw className="w-3.5 h-3.5" /> {t('classCode.replace')}
        </button>
      </div>
      {showQr && link && <QrImage link={link} sectionName={sectionName} />}
      <ConfirmationModal
        isOpen={confirmReplace}
        onClose={() => setConfirmReplace(false)}
        onConfirm={() => replace.mutate()}
        isPending={replace.isPending}
        title={t('classCode.replaceTitle')}
        message={t('classCode.replaceMessage', { section: sectionName })}
        confirmText={t('classCode.replace')}
        cancelText={t('common:actions.cancel')}
      />
    </div>
  );
}
