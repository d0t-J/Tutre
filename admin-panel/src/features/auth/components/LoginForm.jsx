import { Lock, Mail, Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  isSubmitting,
  handleLogin
}) {
  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-1">
        <label className="text-[13px] font-semibold text-slate-700 ml-1">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@co-tutor.com"
            className="w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-[13px]"
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[13px] font-semibold text-slate-700 ml-1">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-9 pr-10 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-[13px]"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !email || !password}
        className="cursor-pointer w-full py-2.5 bg-primary-600 text-white font-bold rounded-lg shadow-sm hover:bg-primary-700 hover:shadow transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 text-[13px]"
      >
        {isSubmitting ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
}
