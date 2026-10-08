import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { ArrowRight, KeyRound, Sparkles } from 'lucide-react';
import { useClassOptions, useProfile, useUpdateProfile } from '../../features/profile';
import { useChangeLanguage } from '../../i18n/useLanguage';
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from '../../features/school/utils/school';

// Set by AuthFormProvider when a new account starts with a session.
const WELCOME_FLAG = 'tutre.welcome';

// Shown once, right after a student creates an account (Phase 5g): pick the
// interface language and class, then join a class with a school code or go
// straight to Tutre's library. Everything here can be changed later on Profile.
export default function Welcome() {
  const { t, i18n } = useTranslation('auth');
  const navigate = useNavigate();
  const changeLanguage = useChangeLanguage();
  const { data: profile } = useProfile();
  const { data: classes = [] } = useClassOptions();
  const updateProfile = useUpdateProfile();
  const [step, setStep] = useState(1);
  const [classId, setClassId] = useState('');
  const [code, setCode] = useState('');

  const finish = (to) => {
    try { sessionStorage.removeItem(WELCOME_FLAG); } catch { /* storage may be blocked */ }
    navigate(to, { replace: true });
  };

  const saveClass = () => {
    if (!classId || classId === profile?.class_id) { setStep(2); return; }
    updateProfile.mutate({ class_id: classId }, {
      onSuccess: () => setStep(2),
      onError: () => toast.error(t('welcome.saveFailed')),
    });
  };

  const cleaned = code.toUpperCase().replace(/[^A-Z0-9]/g, '');

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6 lg:p-8">
      <section className="bg-white p-5 sm:p-7 rounded-2xl shadow-sm border border-slate-100 space-y-5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-600" />
          <h1 className="text-lg font-extrabold text-slate-800">{t('welcome.title', { name: profile?.display_name ?? '' })}</h1>
          <span className="ms-auto text-xs font-bold text-slate-400">{t('welcome.step', { step, total: 2 })}</span>
        </div>

        {step === 1 ? (
          <>
            <div>
              <p className={labelClass}>{t('welcome.language')}</p>
              <div className="flex gap-2">
                {['en', 'ur'].map(lng => (
                  <button key={lng} type="button" onClick={() => changeLanguage(lng)} lang={lng}
                    className={`cursor-pointer flex-1 py-2.5 rounded-xl text-sm font-bold border ${
                      i18n.language === lng ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}>
                    {lng === 'ur' ? 'اردو' : 'English'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="welcome-class" className={labelClass}>{t('welcome.class')}</label>
              <select id="welcome-class" value={classId || profile?.class_id || ''} onChange={(e) => setClassId(e.target.value)} className={inputClass}>
                <option value="">{t('welcome.chooseClass')}</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button type="button" onClick={saveClass} disabled={updateProfile.isPending} className={primaryButtonClass}>
              {t('welcome.next')} <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
            </button>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><KeyRound className="w-4 h-4 text-primary-600" /> {t('welcome.codeTitle')}</p>
              <p className="text-sm text-slate-500">{t('welcome.codeExplain')}</p>
            </div>
            <input type="text" dir="ltr" maxLength={14} placeholder="ABCDE-23456" value={code} aria-label={t('welcome.codeTitle')}
              onChange={(e) => setCode(e.target.value)} autoCapitalize="characters" spellCheck={false}
              className={`${inputClass} font-mono text-lg tracking-widest uppercase`} />
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={cleaned.length !== 10} onClick={() => finish(`/join?code=${cleaned}`)} className={primaryButtonClass}>
                {t('welcome.join')}
              </button>
              <button type="button" onClick={() => finish('/dashboard')} className={secondaryButtonClass}>
                {t('welcome.skip')}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
