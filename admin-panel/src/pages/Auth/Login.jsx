import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import LoginForm from '../../features/auth/components/LoginForm';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await login(email, password);
      
      if (error) {
        throw error;
      }

      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Failed to login');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-50 via-primary-50/30 to-slate-100 p-4 font-sans text-slate-800 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-95 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-6 relative z-10">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-linear-to-br from-primary-100 to-primary-50 rounded-xl flex items-center justify-center mx-auto mb-3 transform rotate-3 shadow-sm border border-primary-100/50">
            <Lock className="w-6 h-6 text-primary-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Admin Login</h1>
          <p className="text-[13px] text-slate-500 mt-1">Secure access to Co-Tutor</p>
        </div>

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
      </div>
    </div>
  );
}
