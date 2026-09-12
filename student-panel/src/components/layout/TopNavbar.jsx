import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../features/auth';
import Logo from '../../assets/co_tutor_new_logo.png';
import LogoutConfirmationModal from '../common/LogoutConfirmationModal';
import ClassNavMenu from './ClassNavMenu';

export default function TopNavbar() {
  const [classes, setClasses] = useState([]);
  const { user, logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  
  useEffect(() => {
    async function fetchClasses() {
      const { data } = await supabase.from('classes').select('*').order('name');
      if (data) {
        const sortedClasses = data.sort((a, b) => 
          a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
        );
        setClasses(sortedClasses);
      }
    }
    fetchClasses();
  }, []);

  return (
    <header className="relative bg-white border-b border-slate-200 h-15 shrink-0 z-40 px-4 flex items-center justify-between">
      {/* Left: Logo */}
      <NavLink to="/dashboard" className="flex items-center gap-2.5 shrink-0 hover:bg-slate-50 transition-colors p-1 rounded-lg">
        <img src={Logo} alt="Co-Tutor" className="h-[33px] w-auto object-contain shrink-0" />
        <div className="hidden sm:flex flex-col justify-center">
          <h1 className="text-xl font-extrabold text-[#62748d] tracking-tight leading-none mb-0.5">Co-Tutor</h1>
          <p className="text-[10px] text-primary-600 font-bold uppercase tracking-wider">Student</p>
        </div>
      </NavLink>

      {/* Center: Classes */}
      <nav className="absolute left-1/2 -translate-x-1/2 top-0 h-full flex items-center justify-center w-[50%] lg:w-auto lg:max-w-[50%] xl:max-w-[60%]">
        <ClassNavMenu classes={classes} />
      </nav>

      {/* Right: User Menu */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden md:flex flex-col items-end mr-1">
          <p className="text-xs font-bold text-slate-800 truncate max-w-30">
            {user?.user_metadata?.full_name || user?.email}
          </p>
        </div>
        
        <button
          onClick={() => setIsLogoutModalOpen(true)}
          className="cursor-pointer flex items-center justify-center p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
          title="Logout"
        >
          <Icons.LogOut className="w-4 h-4" />
        </button>
      </div>

      <LogoutConfirmationModal 
        isOpen={isLogoutModalOpen} 
        onClose={() => setIsLogoutModalOpen(false)} 
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          logout();
        }} 
      />
    </header>
  );
}
