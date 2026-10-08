import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Clock, ExternalLink, KeyRound, Loader2, XCircle } from 'lucide-react';
import {
  peekInviteCode, useCancelJoinRequest, useMyJoinRequests, useRequestToJoin,
} from '../../features/school';
import { useProfile } from '../../features/profile';
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from '../../features/school/utils/school';
import { translateError } from '../../i18n/errors';
import { formatDate } from '../../i18n';
import { STAFF_PORTAL_URL } from '../../services/portals';

// Joining a class (Phase 5g). The student enters the code from their school (a
// class code, or their own slip), sees which school, section and teacher it is
// for, and asks to join with their name and roll number as the school has them.
// A teacher or the school's admin approves; only then is the student in.

const STATUS_STYLE = {
  pending: { Icon: Clock, className: 'bg-amber-50 text-amber-700' },
  approved: { Icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700' },
  rejected: { Icon: XCircle, className: 'bg-red-50 text-red-700' },
  cancelled: { Icon: XCircle, className: 'bg-slate-100 text-slate-500' },
};

function MyRequests() {
  const { t } = useTranslation('school');
  const { data: requests = [] } = useMyJoinRequests();
  const cancel = useCancelJoinRequest();
  if (requests.length === 0) return null;

  return (
    <section className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
      <h3 className="text-sm font-bold text-slate-700 mb-3">{t('request.mine')}</h3>
      <ul className="divide-y divide-slate-100">
        {requests.map(r => {
          const { Icon, className } = STATUS_STYLE[r.status];
          return (
            <li key={r.id} className="py-3 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-sm font-medium text-slate-800">
                <bdi>{[r.org_name, r.section_name].filter(Boolean).join(' · ')}</bdi>
              </span>
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${className}`}>
                <Icon className="w-3 h-3" /> {t(`request.status.${r.status}`)}
              </span>
              <span className="text-xs text-slate-400">{formatDate(r.decided_at ?? r.created_at)}</span>
              {r.status === 'pending' && (
                <button
                  type="button"
                  disabled={cancel.isPending}
                  onClick={() => cancel.mutate(r.id, { onError: (err) => toast.error(translateError(err, t, 'request.failed')) })}
                  className={`ms-auto ${secondaryButtonClass}`}
                >
                  {t('request.cancel')}
                </button>
              )}
              {r.status === 'rejected' && r.reason && (
                <p className="w-full text-xs text-slate-500">{t('request.reason', { reason: r.reason })}</p>
              )}
              {r.status === 'pending' && <p className="w-full text-xs text-slate-500">{t('request.waiting')}</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function Join() {
  const { t } = useTranslation('school');
  const [params] = useSearchParams();
  const { data: profile } = useProfile();
  // A join link (…/join?code=ABCDE-23456) fills in the code.
  const [code, setCode] = useState(() => (params.get('code') ?? '').slice(0, 14));
  const [info, setInfo] = useState(null);
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);
  const requestToJoin = useRequestToJoin();

  const cleaned = code.toUpperCase().replace(/[^A-Z0-9]/g, '');

  const handleCheck = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setInfo(null);
    setChecking(true);
    try {
      const peek = await peekInviteCode(cleaned);
      if (!peek?.valid) {
        setError(t('join.invalid'));
        return;
      }
      setInfo(peek);
      setFullName(peek.slip_name ?? profile?.display_name ?? '');
    } catch (err) {
      setError(translateError(err, t, 'join.failed'));
    } finally {
      setChecking(false);
    }
  };

  const handleRequest = (e) => {
    e.preventDefault();
    setError(null);
    requestToJoin.mutate(
      { code: cleaned, fullName: fullName.trim(), rollNumber: rollNumber.trim() },
      {
        onSuccess: (data) => { setResult(data); setInfo(null); setCode(''); },
        onError: (err) => setError(translateError(err, t, 'join.failed')),
      }
    );
  };

  const place = (data) => [data.org_name, data.section_name].filter(Boolean).join(' · ');
  const back = () => { setInfo(null); setError(null); };

  // What the checked code allows.
  let checked = null;
  if (info && info.role !== 'student') {
    checked = (
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 space-y-2">
        <p className="text-sm text-slate-700">{t('joinStaff.staffCode', { school: info.org_name })}</p>
        {STAFF_PORTAL_URL && (
          <a href={`${STAFF_PORTAL_URL}/join`} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-700 hover:underline">
            <ExternalLink className="w-4 h-4" /> {t('joinStaff.open')}
          </a>
        )}
      </div>
    );
  } else if (info && info.already_member) {
    checked = <p className="text-sm text-slate-700">{t('request.alreadyIn', { place: place(info) })}</p>;
  } else if (info && !info.school_open) {
    checked = <p className="text-sm text-slate-700">{t('request.notOpen', { school: info.org_name })}</p>;
  } else if (info && info.pending_request) {
    checked = <p className="text-sm text-slate-700">{t('request.alreadyAsked', { place: place(info) })}</p>;
  } else if (info) {
    checked = (
      <form onSubmit={handleRequest} className="space-y-3">
        <div className="p-3 rounded-xl bg-primary-50 border border-primary-100 text-sm text-slate-700 space-y-0.5">
          <p className="font-bold"><bdi>{place(info)}</bdi></p>
          {info.teachers?.length > 0 && (
            <p>{t('request.teachers', { names: info.teachers.join(t('common:list.separator')) })}</p>
          )}
          {info.slip_name && <p>{t('request.slipFor', { name: info.slip_name })}</p>}
        </div>
        <p className="text-xs text-slate-500">{t('request.explain')}</p>
        <div>
          <label htmlFor="join-full-name" className={labelClass}>{t('request.fullName')}</label>
          <input id="join-full-name" type="text" dir="auto" required minLength={2} maxLength={120} autoComplete="name"
            value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
        </div>
        <div className="max-w-48">
          <label htmlFor="join-roll" className={labelClass}>{t('request.rollNumber')}</label>
          <input id="join-roll" type="text" dir="ltr" required maxLength={30} autoComplete="off"
            value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} className={inputClass} />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={requestToJoin.isPending || fullName.trim().length < 2 || !rollNumber.trim()}
            className={primaryButtonClass}>
            {requestToJoin.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('request.submit')}
          </button>
          <button type="button" onClick={back} className={secondaryButtonClass}>{t('common:actions.back')}</button>
        </div>
      </form>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
      <section className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-extrabold text-slate-800">{t('join.title')}</h2>
        </div>
        <p className="text-sm text-slate-500 mb-5">{t('join.message')}</p>

        {!info ? (
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
        ) : checked}

        {info && info.role !== 'student' && (
          <button type="button" onClick={back} className={`mt-3 ${secondaryButtonClass}`}>{t('common:actions.back')}</button>
        )}

        {result && (
          <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-sm text-slate-700">
                {result.status === 'already_member' ? (
                  <p className="font-bold">{t('request.alreadyIn', { place: place(result) })}</p>
                ) : (
                  <>
                    <p className="font-bold">{t('request.sent')}</p>
                    <p>{t('request.sentDetail', { place: place(result) })}</p>
                  </>
                )}
                <Link to="/dashboard" className="inline-block mt-2 text-sm font-bold text-primary-700 hover:underline">
                  {t('join.next.student')}
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      <MyRequests />
    </div>
  );
}
