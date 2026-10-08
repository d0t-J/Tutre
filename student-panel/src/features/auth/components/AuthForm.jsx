import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/useAuth';
import { AuthFormProvider } from '../context/AuthFormProvider';
import { useAuthForm } from '../context/useAuthForm';
import AuthStats from './AuthStats';
import AuthFormFields from './AuthFormFields';
import ResetWithCodeForm from './ResetWithCodeForm';

function AuthFormContent() {
  const { t } = useTranslation('auth');
  const [loaded, setLoaded] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { isLogin, setIsLogin } = useAuthForm();

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="w-full flex flex-col items-center gap-3 sm:gap-5 px-4 sm:px-6 py-3 sm:py-6 mx-auto max-w-105 sm:max-w-115">

      {/* Form Container */}
      <div className="w-full">
        <div className={`w-full relative z-10 transition-all duration-700 ${loaded ? 'animate-slide-in-right' : 'opacity-0 translate-x-10'}`}>

          {/* Form Header */}
          <div className="text-center mb-2 sm:mb-5">
            <h2 className="text-base sm:text-xl font-bold text-slate-800 tracking-tight">
              {resetting ? t('reset.title') : isLogin ? t('login.title') : t('signup.title')}
            </h2>
            <p className="text-[11px] sm:text-sm text-slate-500 mt-0.5 leading-tight">
              {isLogin ? t('login.subtitle') : t('signup.subtitle')}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/80 backdrop-blur-2xl rounded-xl sm:rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-white/80 p-3 sm:p-6">
            {resetting ? <ResetWithCodeForm onDone={() => setResetting(false)} /> : <AuthFormFields />}
          </div>

          {isLogin && !resetting && (
            <div className="mt-2 text-center">
              <button type="button" onClick={() => setResetting(true)}
                className="text-xs sm:text-sm text-slate-500 hover:text-primary-700 font-semibold cursor-pointer">
                {t('reset.link')}
              </button>
            </div>
          )}

          <div className="mt-2 sm:mt-4 text-center">
            <p className="text-xs sm:text-sm text-slate-500">
              {isLogin ? t('login.noAccount') : t('signup.haveAccount')}{' '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary-600 font-bold hover:text-primary-700 cursor-pointer transition-colors relative after:absolute after:bottom-0 after:start-0 after:w-0 after:h-0.5 after:bg-primary-500 after:transition-all hover:after:w-full"
              >
                {isLogin ? t('login.switchToSignup') : t('signup.switchToLogin')}
              </button>
            </p>
          </div>
        </div>
      </div>

      <AuthStats loaded={loaded} />

    </div>
  );
}

export default function AuthForm() {
  const { user } = useAuth();
  const location = useLocation();

  // Signed in: back to the page that asked for it (a join link, for example),
  // or the dashboard. Only paths inside this app are followed.
  if (user) {
    const from = location.state?.from;
    let isNew = false;
    try { isNew = sessionStorage.getItem('tutre.welcome') === '1'; } catch { /* storage may be blocked */ }
    const back = from?.pathname?.startsWith('/') && !from.pathname.startsWith('//') && from.pathname !== '/login'
      ? `${from.pathname}${from.search ?? ''}`
      : isNew ? '/welcome' : '/dashboard';
    return <Navigate to={back} replace />;
  }

  return (
    <AuthFormProvider>
      <AuthFormContent />
    </AuthFormProvider>
  );
}
