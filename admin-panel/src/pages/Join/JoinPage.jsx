import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ExternalLink, KeyRound, Loader2 } from 'lucide-react';
import { peekInviteCode, useRedeemCode } from '../../features/school';
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from '../../features/school/utils/school';
import { translateError } from '../../i18n/errors';
import { useAuth } from '../../context/AuthContext';
import { STUDENT_APP_URL } from '../../services/portals';

const NEXT_STEP = {
  org_admin: { to: '/school', key: 'join.next.org_admin' },
  teacher: { to: '/classroom', key: 'join.next.teacher' },
};

// Joining a school's staff with a code. The code is checked first
// (peek_invite_code) so the person sees what they are joining before it is
// used, and a student code is sent to the student app instead.
export default function JoinPage() {
  const { t } = useTranslation('school');
  const { isStaff, hasSuspendedSchool } = useAuth();
  const [params] = useSearchParams();
  // A join link (…/join?code=ABCDE-23456) fills in the code.
  const [code, setCode] = useState(() => (params.get('code') ?? '').slice(0, 14));
  const [peek, setPeek] = useState(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const redeem = useRedeemCode();

  const cleaned = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const describe = (info) => t(info.section_name ? 'join.confirmAsInSection' : 'join.confirmAs', {
    school: info.org_name,
    role: t(`common:roles.${info.role}`),
    section: info.section_name,
  });

  const handleCheck = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setChecking(true);
    try {
      const info = await peekInviteCode(cleaned);
      if (!info?.valid) setError(t('join.invalid'));
      else setPeek(info);
    } catch (err) {
      setError(translateError(err, t, 'join.failed'));
    } finally {
      setChecking(false);
    }
  };

  const handleJoin = () => {
    redeem.mutate(cleaned, {
      onSuccess: (data) => {
        setResult(data);
        setPeek(null);
        setCode('');
      },
      onError: (err) => setError(translateError(err, t, 'join.failed')),
    });
  };

  const reset = () => { setPeek(null); setError(null); };
  const next = result && NEXT_STEP[result.role];
  const isStudentCode = peek?.role === 'student';

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-xl mx-auto p-4 sm:p-0">
        <section className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-extrabold text-slate-800">{t('join.title')}</h2>
          </div>
          {!isStaff && (
            <p className="text-sm text-slate-600 mb-2">
              {hasSuspendedSchool ? t('join.suspended') : t('join.notStaffYet')}
            </p>
          )}
          <p className="text-sm text-slate-500 mb-5">{t('join.message')}</p>

          {!peek ? (
            <form onSubmit={handleCheck} className="space-y-3">
              <div>
                <label htmlFor="invite-code" className={labelClass}>{t('join.code')}</label>
                <input
                  id="invite-code"
                  type="text"
                  dir="ltr"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={14}
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setError(null); }}
                  placeholder="ABCDE-23456"
                  className={`${inputClass} font-mono text-lg tracking-widest uppercase`}
                />
                {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
              </div>
              <button type="submit" disabled={cleaned.length !== 10 || checking} className={primaryButtonClass}>
                {checking && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('join.check')}
              </button>
            </form>
          ) : isStudentCode ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-700">{t('join.studentCode')}</p>
              <div className="flex flex-wrap gap-2">
                {STUDENT_APP_URL && (
                  <a href={`${STUDENT_APP_URL}/join`} className={primaryButtonClass}>
                    <ExternalLink className="w-4 h-4" /> {t('join.openStudentApp')}
                  </a>
                )}
                <button type="button" onClick={reset} className={secondaryButtonClass}>{t('common:actions.back')}</button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-800">{describe(peek)}</p>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={handleJoin} disabled={redeem.isPending} className={primaryButtonClass}>
                  {redeem.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t('join.submit')}
                </button>
                <button type="button" onClick={reset} disabled={redeem.isPending} className={secondaryButtonClass}>
                  {t('common:actions.cancel')}
                </button>
              </div>
            </div>
          )}

          {result && (
            <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-sm text-slate-700">
                  <p className="font-bold">
                    {result.already_member ? t('join.alreadyMember') : t('join.joined')}
                  </p>
                  <p>
                    {t(result.section_name ? 'join.joinedAsInSection' : 'join.joinedAs', {
                      school: result.org_name,
                      role: t(`common:roles.${result.role}`),
                      section: result.section_name,
                    })}
                  </p>
                  {next && (
                    <Link to={next.to} className="inline-block mt-2 text-sm font-bold text-primary-700 hover:underline">
                      {t(next.key)}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
