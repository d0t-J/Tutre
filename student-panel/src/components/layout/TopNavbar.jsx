import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as Icons from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../features/auth';
import Logo from '../../assets/tutre_new_logo.png';
import LogoutConfirmationModal from '../common/LogoutConfirmationModal';
import LanguageSwitcher from '../common/LanguageSwitcher';
import ClassNavMenu from './ClassNavMenu';
import { useProfile } from '../../features/profile';
import { useMyRoles } from '../../features/school';

export default function TopNavbar() {
  const { t } = useTranslation();
  const [classes, setClasses] = useState([]);
  const { user, logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { data: profile } = useProfile();
  const { data: roles } = useMyRoles();

  // Join shows until the student is in a school. My school and My sections
  // moved to the staff portal in Phase 5a.
  const roleLinks = [
    roles && !roles.hasSchool && { to: '/join', icon: Icons.KeyRound, label: t('nav.join') },
  ].filter(Boolean);
  
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
      {/* Start: Logo */}
      <NavLink to="/dashboard" className="flex items-center gap-2.5 shrink-0 hover:bg-slate-50 transition-colors p-1 rounded-lg">
        <img src={Logo} alt="Tutre" className="h-[33px] w-auto object-contain shrink-0" />
        <div className="hidden sm:flex flex-col justify-center">
          <h1 className="text-xl font-extrabold text-[#62748d] tracking-tight leading-none mb-0.5">Tutre</h1>
          <p className="text-[10px] text-primary-600 font-bold uppercase tracking-wider">{t('brand.student')}</p>
        </div>
      </NavLink>

      {/* Center: Classes */}
      <nav className="absolute left-1/2 -translate-x-1/2 top-0 h-full flex items-center justify-center w-[50%] lg:w-auto lg:max-w-[50%] xl:max-w-[60%]">
        <ClassNavMenu classes={classes} />
      </nav>

      {/* End: User Menu */}
      <div className="flex items-center gap-3 shrink-0">
        <LanguageSwitcher className="[&>span]:hidden xl:[&>span]:inline" />

        {roleLinks.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              `flex items-center gap-1.5 p-2 rounded-lg text-xs font-bold transition-colors ${
                isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="hidden xl:inline whitespace-nowrap">{label}</span>
          </NavLink>
        ))}

        <NavLink
          to="/profile"
          title={t('nav.profile')}
          className={({ isActive }) =>
            `flex items-center gap-2 p-2 rounded-lg transition-colors ${
              isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-100'
            }`
          }
        >
          <Icons.UserRound className="w-4 h-4 shrink-0" />
          <span className="hidden md:block text-xs font-bold text-slate-800 truncate max-w-30">
            {profile?.display_name || user?.user_metadata?.full_name || user?.email}
          </span>
        </NavLink>
        
        <button
          onClick={() => setIsLogoutModalOpen(true)}
          className="cursor-pointer flex items-center justify-center p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
          title={t('nav.logout')}
          aria-label={t('nav.logout')}
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
