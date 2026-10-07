import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ExternalLink, KeyRound, Loader2 } from 'lucide-react';
import { peekInviteCode, useRedeemCode } from '../../features/school';
import { inputClass, labelClass, primaryButtonClass } from '../../features/school/utils/school';
import { translateError } from '../../i18n/errors';
import { STAFF_PORTAL_URL } from '../../services/portals';

const NEXT_STEP = {
  student: { to: '/dashboard', key: 'join.next.student' },
};

export default function Join() {
  const { t } = useTranslation('school');
  const [params] = useSearchParams();
  // A join link (…/join?code=ABCDE-23456) fills in the code.
  const [code, setCode] = useState(() => (params.get('code') ?? '').slice(0, 14));
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [staffCode, setStaffCode] = useState(null);
  const [checking, setChecking] = useState(false);
  const redeem = useRedeemCode();

  const cleaned = code.toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Staff codes (teacher, school admin) are used in the staff portal, so the
  // code is checked before it is redeemed here.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setStaffCode(null);
    setChecking(true);
    try {
      const info = await peekInviteCode(cleaned);
      if (info?.valid && info.role !== 'student') {
        setStaffCode(info);
        return;
      }
    } catch (err) {
      setError(translateError(err, t, 'join.failed'));
      return;
    } finally {
      setChecking(false);
    }
    redeem.mutate(cleaned, {
      onSuccess: (data) => {
        setResult(data);
        setCode('');
      },
      onError: (err) => setError(translateError(err, t, 'join.failed')),
    });
  };

  const next = result && NEXT_STEP[result.role];
  const joinedAs = result && t(result.section_name ? 'join.joinedAsInSection' : 'join.joinedAs', {
    school: result.org_name,
    role: t(`common:roles.${result.role}`),
    section: result.section_name,
  });

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 lg:p-8">
      <section className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-extrabold text-slate-800">{t('join.title')}</h2>
        </div>
        <p className="text-sm text-slate-500 mb-5">{t('join.message')}</p>

        <form onSubmit={handleSubmit} className="space-y-3">
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
          <button type="submit" disabled={cleaned.length !== 10 || checking || redeem.isPending} className={primaryButtonClass}>
            {(checking || redeem.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('join.submit')}
          </button>
        </form>

        {staffCode && (
          <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-100 space-y-2">
            <p className="text-sm text-slate-700">{t('joinStaff.staffCode', { school: staffCode.org_name })}</p>
            {STAFF_PORTAL_URL && (
              <a href={`${STAFF_PORTAL_URL}/join`} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-700 hover:underline">
                <ExternalLink className="w-4 h-4" /> {t('joinStaff.open')}
              </a>
            )}
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
                <p>{joinedAs}</p>
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
  );
}
