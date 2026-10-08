import { Mail, Lock, Loader2, Eye, EyeOff, User, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthForm } from '../context/useAuthForm';

export default function AuthFormFields() {
  const { t } = useTranslation('auth');
  const {
    isLogin,
    fullName,
    setFullName,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isSubmitting,
    handleSubmit
  } = useAuthForm();

  return (
    <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-4">
      {!isLogin && (
        <div className="space-y-1 animate-fade-in-up">
          <label htmlFor="auth-full-name" className="text-[12px] sm:text-[13px] font-semibold text-slate-700 ms-0.5">{t('fields.fullName')}</label>
          <div className="relative group">
            <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
            <input
              id="auth-full-name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('fields.fullNamePlaceholder')}
              className="w-full ps-9 pe-3 py-2 sm:py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-lg sm:rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-[13px] sm:text-sm placeholder:text-slate-400"
              required={!isLogin}
            />
          </div>
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="auth-email" className="text-[12px] sm:text-[13px] font-semibold text-slate-700 ms-0.5">{t('fields.email')}</label>
        <div className="relative group">
          <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@tutre.com"
            className="w-full ps-9 pe-3 py-2 sm:py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-lg sm:rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-[13px] sm:text-sm placeholder:text-slate-400"
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="auth-password" className="text-[12px] sm:text-[13px] font-semibold text-slate-700 ms-0.5">{t('fields.password')}</label>
        <div className="relative group">
          <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            id="auth-password"
            type={showPassword ? "text" : "password"}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            minLength={isLogin ? undefined : 8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full ps-9 pe-10 py-2 sm:py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-lg sm:rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-[13px] sm:text-sm placeholder:text-slate-400"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? t('fields.hidePassword') : t('fields.showPassword')}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none p-0.5 cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {!isLogin && <p className="text-[11px] text-slate-400 ms-0.5">{t('signup.passwordHint')}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !email || !password || (!isLogin && (!fullName || password.length < 8))}
        className="cursor-pointer w-full py-2 sm:py-2.5 bg-linear-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-lg sm:rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:from-primary-700 hover:to-primary-800 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[13px] sm:text-sm group mt-4 sm:mt-6"
      >
        {isSubmitting ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> {isLogin ? t('login.submitting') : t('signup.submitting')}</>
        ) : (
          <>
            {isLogin ? t('login.submit') : t('signup.submit')}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
          </>
        )}
      </button>
    </form>
  );
}
