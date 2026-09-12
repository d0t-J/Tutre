import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import logo from '../../../assets/co_tutor_logo.png';

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="w-full bg-white border-t border-slate-200/60 relative z-20">
      {/* Final CTA Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-20 lg:py-32 border-b border-slate-200/60 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-800 tracking-tight mb-6">
          Ready to explore the universe?
        </h2>
        <p className="text-slate-500 text-base sm:text-lg mb-10 max-w-2xl mx-auto">
          Join thousands of students mastering STEM subjects through real-time interactive simulations.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-8 py-4 bg-linear-to-r from-primary-600 to-primary-700 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-base mx-auto group cursor-pointer"
        >
          Create Free Account
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Main Footer */}
      <div className="max-w-360 mx-auto px-4 sm:px-8 lg:px-16 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img src={logo} alt="Co-Tutor Logo" className="w-8 h-8 object-contain grayscale opacity-60" />
          <div>
            <h1 className="text-lg font-bold text-slate-400 tracking-tight leading-none">Co-Tutor</h1>
            <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">Student Portal</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="flex items-center justify-center text-sm font-medium text-slate-400">
          <p>&copy; {new Date().getFullYear()} Co-Tutor. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
