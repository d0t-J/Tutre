import { NavLink } from 'react-router-dom';
import { Wand2, Database, Library } from 'lucide-react';

export default function NavLinks({ onLinkClick }) {
  const links = [
    { to: '/', icon: Wand2, label: 'Create Animation', end: true },
    { to: '/saved', icon: Database, label: 'Saved Simulations' },
    { to: '/curriculum', icon: Library, label: 'Curriculum' }
  ];

  return (
    <>
      {links.map(({ to, icon: Icon, label, end }) => (
        <NavLink 
          key={to}
          to={to} 
          end={end}
          onClick={onLinkClick}
          className={({ isActive }) => 
            `cursor-pointer flex items-center justify-center whitespace-nowrap shrink-0 gap-2 lg:gap-1.5 px-4 lg:px-3 py-3 lg:py-1.5 rounded-md text-sm font-bold transition-all min-w-32.5 ${
              isActive 
                ? 'bg-primary-50 lg:bg-white text-primary-700 lg:shadow-sm lg:border lg:border-slate-200' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hover:bg-slate-200/50 lg:border lg:border-transparent'
            }`
          }
        >
          <Icon className="w-4 h-4 lg:w-3.5 lg:h-3.5 shrink-0" />
          <span>{label}</span>
        </NavLink>
      ))}
    </>
  );
}
