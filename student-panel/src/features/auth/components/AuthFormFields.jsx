import { Mail, Lock, Loader2, Eye, EyeOff, User, ArrowRight } from 'lucide-react';
import { useAuthForm } from '../context/useAuthForm';

export default function AuthFormFields() {
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
          <label className="text-[12px] sm:text-[13px] font-semibold text-slate-700 ml-0.5">Full Name</label>
          <div className="relative group">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              className="w-full pl-9 pr-3 py-2 sm:py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-lg sm:rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-[13px] sm:text-sm placeholder:text-slate-400"
              required={!isLogin}
            />
          </div>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-[12px] sm:text-[13px] font-semibold text-slate-700 ml-0.5">Email Address</label>
        <div className="relative group">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@co-tutor.com"
            className="w-full pl-9 pr-3 py-2 sm:py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-lg sm:rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-[13px] sm:text-sm placeholder:text-slate-400"
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[12px] sm:text-[13px] font-semibold text-slate-700 ml-0.5">Password</label>
        <div className="relative group">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-9 pr-10 py-2 sm:py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-lg sm:rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-[13px] sm:text-sm placeholder:text-slate-400"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none p-0.5 cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !email || !password || (!isLogin && !fullName)}
        className="cursor-pointer w-full py-2 sm:py-2.5 bg-linear-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-lg sm:rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:from-primary-700 hover:to-primary-800 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[13px] sm:text-sm group mt-4 sm:mt-6"
      >
        {isSubmitting ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> {isLogin ? 'Logging in...' : 'Creating account...'}</>
        ) : (
          <>
            {isLogin ? 'Log In' : 'Create Account'}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>
    </form>
  );
}
