import { useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { KeyRound, Loader2, X } from 'lucide-react';
import { createPasswordResetCode } from '../hooks/useStudentJoining';
import { translateError } from '../../../i18n/errors';
import { formatDate, secondaryButtonClass } from '../utils/school';

// A one-time password reset code for a student (or, for a school admin, a
// teacher) who forgot their password (Phase 5g; there is no email yet). The
// code is shown once here; only its fingerprint is stored. The person enters
// it with a new password on the sign-in page.
export default function ResetPasswordButton({ userId, name }) {
  const { t } = useTranslation('school');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      setResult(await createPasswordResetCode(userId));
    } catch (err) {
      toast.error(translateError(err, t, 'reset.failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" onClick={create} disabled={busy} className={secondaryButtonClass} title={t('reset.title', { name })}>
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />} {t('reset.button')}
      </button>
      {result && createPortal(
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="reset-title">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setResult(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h3 id="reset-title" className="text-base font-bold text-slate-800">{t('reset.title', { name })}</h3>
              <button type="button" onClick={() => setResult(null)} aria-label={t('common:actions.close')} className="cursor-pointer p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <code className="block text-center font-mono text-3xl font-extrabold tracking-[0.3em] text-primary-700 py-2" dir="ltr">{result.code}</code>
            <p className="text-sm text-slate-600">{t('reset.instructions', { time: formatDate(result.expires_at, { hour: '2-digit', minute: '2-digit' }) })}</p>
            <p className="text-xs text-slate-400">{t('reset.once')}</p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
