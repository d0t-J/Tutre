import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { KeyRound, Loader2, Lock, Mail } from 'lucide-react';
import { resetPasswordWithCode } from '../../../services/passwordReset';

const fieldClass = 'w-full ps-9 pe-3 py-2 sm:py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-lg sm:rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-[13px] sm:text-sm placeholder:text-slate-400';
const labelClass = 'text-[12px] sm:text-[13px] font-semibold text-slate-700 ms-0.5';

// Forgot your password? There is no email yet (Phase 5g): your teacher gives
// you a one-time reset code, and you choose a new password here.
export default function ResetWithCodeForm({ onDone }) {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await resetPasswordWithCode({ email: email.trim(), code: code.trim(), password });
      toast.success(t('reset.done'));
      onDone();
    } catch (err) {
      // The function's messages are generic on purpose; show ours.
      toast.error(/password/i.test(err.message) && !/code/i.test(err.message) ? t('reset.weak') : t('reset.invalid'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-[12px] sm:text-[13px] text-slate-500">{t('reset.explain')}</p>
      <div className="space-y-1">
        <label htmlFor="reset-email" className={labelClass}>{t('fields.email')}</label>
        <div className="relative">
          <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input id="reset-email" type="email" required autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor="reset-code" className={labelClass}>{t('reset.code')}</label>
        <div className="relative">
          <KeyRound className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input id="reset-code" type="text" dir="ltr" required maxLength={12} autoComplete="one-time-code"
            autoCapitalize="characters" spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)}
            className={`${fieldClass} font-mono tracking-widest uppercase`} />
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor="reset-password" className={labelClass}>{t('reset.newPassword')}</label>
        <div className="relative">
          <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input id="reset-password" type="password" required minLength={8} maxLength={72} autoComplete="new-password"
            value={password} onChange={(e) => setPassword(e.target.value)} className={fieldClass} />
        </div>
        <p className="text-[11px] text-slate-400 ms-0.5">{t('signup.passwordHint')}</p>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={busy || !email || !code.trim() || password.length < 8}
          className="cursor-pointer flex-1 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} {t('reset.submit')}
        </button>
        <button type="button" onClick={onDone} className="cursor-pointer px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100">
          {t('reset.back')}
        </button>
      </div>
    </form>
  );
}
