import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Loader2, Mail, UserRound, MailCheck } from 'lucide-react';
import { toast } from 'sonner';
import LoginForm from '../../features/auth/components/LoginForm';
import { STUDENT_APP_URL } from '../../services/portals';

const fieldClass = 'w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-[13px]';

// Where to go after signing in: back to the page that asked for it (a join
// link, for example), or home. Only paths inside this app are followed.
const returnPath = (location, fallback) => {
  const from = location.state?.from;
  return from?.pathname?.startsWith('/') && !from.pathname.startsWith('//') && from.pathname !== '/login'
    ? `${from.pathname}${from.search ?? ''}`
    : fallback;
};

// A new teacher or principal creates an account here, then joins their school
// with the staff code they were given (the Join page).
function SignupForm({ onDone }) {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data, error } = await signup(email, password, fullName.trim());
      if (error) throw error;
      // With email confirmation on there is no session until the address is
      // confirmed.
      if (data?.session) navigate(returnPath(location, '/join'));
      else onDone(email);
    } catch (err) {
      toast.error(err.message || 'Could not create the account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="signup-name" className="text-[13px] font-semibold text-slate-700 ml-1">Full name</label>
        <div className="relative">
          <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input id="signup-name" type="text" required minLength={2} maxLength={80} autoComplete="name" dir="auto"
            value={fullName} onChange={(e) => setFullName(e.target.value)} className={fieldClass} />
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor="signup-email" className="text-[13px] font-semibold text-slate-700 ml-1">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input id="signup-email" type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor="signup-password" className="text-[13px] font-semibold text-slate-700 ml-1">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input id="signup-password" type="password" required minLength={8} autoComplete="new-password"
            value={password} onChange={(e) => setPassword(e.target.value)} className={fieldClass} />
        </div>
        <p className="text-[11px] text-slate-400 ml-1">At least 8 characters.</p>
      </div>
      <button
        type="submit"
        disabled={isSubmitting || fullName.trim().length < 2 || !email || password.length < 8}
        className="cursor-pointer w-full py-2.5 bg-primary-600 text-white font-bold rounded-lg shadow-sm hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[13px]"
      >
        {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create account'}
      </button>
    </form>
  );
}

export default function Login() {
  const [mode, setMode] = useState('signin');
  const [confirmEmail, setConfirmEmail] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await login(email, password);
      if (error) throw error;
      navigate(returnPath(location, '/'));
    } catch (err) {
      toast.error(err.message || 'Failed to login');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabClass = (active) =>
    `cursor-pointer flex-1 py-1.5 rounded-md text-xs font-bold transition-colors ${active ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-50 via-primary-50/30 to-slate-100 p-4 font-sans text-slate-800 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-95 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-6 relative z-10">
        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-linear-to-br from-primary-100 to-primary-50 rounded-xl flex items-center justify-center mx-auto mb-3 transform rotate-3 shadow-sm border border-primary-100/50">
            <Lock className="w-6 h-6 text-primary-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Tutre Staff Portal</h1>
          <p className="text-[13px] text-slate-500 mt-1">For teachers, principals and the Tutre team</p>
        </div>

        {confirmEmail ? (
          <div className="text-center space-y-3">
            <MailCheck className="w-8 h-8 text-primary-600 mx-auto" />
            <p className="text-sm text-slate-700">
              We sent a confirmation link to <span className="font-bold break-all">{confirmEmail}</span>.
              Confirm your address, then sign in and enter your school&apos;s staff code.
            </p>
            <button type="button" onClick={() => { setConfirmEmail(null); setMode('signin'); }}
              className="cursor-pointer text-sm font-bold text-primary-700 hover:underline">
              Back to sign in
            </button>
          </div>
        ) : (
          <>
            <div role="tablist" className="flex gap-1 p-0.5 mb-5 bg-slate-100 rounded-lg">
              <button type="button" role="tab" aria-selected={mode === 'signin'} onClick={() => setMode('signin')} className={tabClass(mode === 'signin')}>
                Sign in
              </button>
              <button type="button" role="tab" aria-selected={mode === 'signup'} onClick={() => setMode('signup')} className={tabClass(mode === 'signup')}>
                Create staff account
              </button>
            </div>

            {mode === 'signin' ? (
              <LoginForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                isSubmitting={isSubmitting}
                handleLogin={handleLogin}
              />
            ) : (
              <SignupForm onDone={setConfirmEmail} />
            )}
          </>
        )}

        {STUDENT_APP_URL && (
          <p className="text-center text-[12px] text-slate-500 mt-5">
            Are you a student? <a href={STUDENT_APP_URL} className="font-bold text-primary-700 hover:underline">Open the student app</a>
          </p>
        )}
      </div>
    </div>
  );
}
