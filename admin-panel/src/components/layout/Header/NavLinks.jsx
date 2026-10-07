import { NavLink } from 'react-router-dom';
import { Wand2, Database, Library, Languages, School, UserRound, Building2, Presentation, KeyRound } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

// The desktop header shows Profile as an icon next to Logout; the mobile menu
// lists it with the other links. Between 1024 and 1280px the desktop links show
// icons only (with the label as a tooltip) so they fit.
// Each person sees only their own parts of the staff portal (Phase 5a):
// Studio for the Tutre content team, My school for school admins and Tutre
// platform admins, My sections for teachers and school admins.
export default function NavLinks({ onLinkClick, showProfile = false }) {
  const { isAdmin, isPlatformAdmin, isSchoolAdmin, canTeach, isStaff } = useAuth();
  const links = [
    ...(isAdmin ? [
      { to: '/', icon: Wand2, label: 'Create Animation', end: true },
      { to: '/saved', icon: Database, label: 'Saved Simulations' },
      { to: '/curriculum', icon: Library, label: 'Curriculum' },
      { to: '/translations', icon: Languages, label: 'Translations' },
    ] : []),
    // Schools (create, suspend) are managed by platform admins only.
    ...(isPlatformAdmin ? [{ to: '/organizations', icon: School, label: 'Schools' }] : []),
    ...(isSchoolAdmin ? [{ to: '/school', icon: Building2, label: 'My school' }] : []),
    ...(canTeach ? [{ to: '/classroom', icon: Presentation, label: 'My sections' }] : []),
    // The content team joins schools rarely; everyone else may need another code.
    ...(!isAdmin || !isStaff ? [{ to: '/join', icon: KeyRound, label: 'Join with a code' }] : []),
    ...(showProfile && isStaff ? [{ to: '/profile', icon: UserRound, label: 'Profile' }] : [])
  ];

  return (
    <>
      {links.map(({ to, icon: Icon, label, end }) => (
        <NavLink 
          key={to}
          to={to} 
          end={end}
          onClick={onLinkClick}
          title={label}
          className={({ isActive }) => 
            `cursor-pointer flex items-center justify-center whitespace-nowrap shrink-0 gap-2 lg:gap-1.5 px-4 lg:px-3 py-3 lg:py-1.5 rounded-md text-sm font-bold transition-all min-w-32.5 lg:min-w-0 xl:min-w-32.5 ${
              isActive 
                ? 'bg-primary-50 lg:bg-white text-primary-700 lg:shadow-sm lg:border lg:border-slate-200' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hover:bg-slate-200/50 lg:border lg:border-transparent'
            }`
          }
        >
          <Icon className="w-4 h-4 lg:w-3.5 lg:h-3.5 shrink-0" />
          <span className="lg:hidden xl:inline">{label}</span>
        </NavLink>
      ))}
    </>
  );
}
