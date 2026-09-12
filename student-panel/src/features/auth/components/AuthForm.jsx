import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { AuthFormProvider } from '../context/AuthFormProvider';
import { useAuthForm } from '../context/useAuthForm';
import AuthStats from './AuthStats';
import AuthFormFields from './AuthFormFields';

function AuthFormContent() {
  const [loaded, setLoaded] = useState(false);
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
              {isLogin ? 'Welcome Back!' : 'Join Co-Tutor'}
            </h2>
            <p className="text-[11px] sm:text-sm text-slate-500 mt-0.5 leading-tight">
              {isLogin ? 'Log in to explore interactive simulations' : 'Create your account to start learning'}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/80 backdrop-blur-2xl rounded-xl sm:rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-white/80 p-3 sm:p-6">
            <AuthFormFields />
          </div>

          <div className="mt-2 sm:mt-4 text-center">
            <p className="text-xs sm:text-sm text-slate-500">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary-600 font-bold hover:text-primary-700 cursor-pointer transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary-500 after:transition-all hover:after:w-full"
              >
                {isLogin ? 'Sign up free' : 'Log in'}
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

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AuthFormProvider>
      <AuthFormContent />
    </AuthFormProvider>
  );
}
