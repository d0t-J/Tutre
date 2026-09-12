import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import logo from '../../../assets/co_tutor_new_logo.png';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login';

  return (
    <div className="fixed top-2 sm:top-4 lg:top-6 left-0 right-0 z-50 px-4 sm:px-6 flex justify-center pointer-events-none">
      <header className="w-full max-w-6xl bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-2xl px-4 py-3 sm:px-6 sm:py-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between pointer-events-auto transition-all duration-300">
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer group" onClick={() => navigate('/')}>
          <img src={logo} alt="Co-Tutor Logo" className="w-[33px] sm:w-[41px] h-[33px] sm:h-[41px] object-contain group-hover:scale-105 transition-transform" />
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#62748d] tracking-tight leading-none">Co-Tutor</h1>
            <p className="text-[8px] sm:text-[10px] text-primary-600 font-bold tracking-widest uppercase mt-0.5">Student Portal</p>
          </div>
        </div>

        {isAuthPage ? (
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 sm:px-5 sm:py-2.5 bg-white text-slate-600 font-bold rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 border border-slate-200 transition-all flex items-center gap-2 text-xs sm:text-sm cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 sm:px-5 sm:py-2.5 bg-white text-primary-600 font-bold rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 border border-slate-200 transition-all flex items-center gap-2 text-xs sm:text-sm cursor-pointer"
          >
            Log In
          </button>
        )}
      </header>
    </div>
  );
}
