import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { slugify } from '../../utils/slugify';
import MobileDropdown from '../common/MobileDropdown';

export default function ClassNavMenu({ classes }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isRootDashboard = location.pathname === '/dashboard' || location.pathname === '/dashboard/';

  if (isRootDashboard) return null;

  return (
    <>
      <div className="hidden lg:flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden w-full px-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {classes.map((cls) => {
          const path = `/class/${slugify(cls.name)}`;
          const isActive = decodeURIComponent(location.pathname).startsWith(path);
          
          return (
            <NavLink
              key={cls.id}
              to={path}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-200'
              }`}
            >
              <Icons.GraduationCap className="w-4 h-4" />
              {cls.name}
            </NavLink>
          );
        })}
      </div>
      
      <div className="block lg:hidden w-full">
        <MobileDropdown 
          icon={Icons.GraduationCap}
          options={classes.map(c => ({ value: c.id, label: c.name }))}
          selectedValue={classes.find(c => decodeURIComponent(location.pathname).startsWith(`/class/${slugify(c.name)}`))?.id}
          onSelect={(val) => {
            const cls = classes.find(c => c.id === val);
            if (cls) navigate(`/class/${slugify(cls.name)}`);
          }}
          placeholder="Class"
          className="p-0! border-none! shadow-none bg-transparent!"
        />
      </div>
    </>
  );
}
