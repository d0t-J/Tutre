import { useState } from 'react';
import { Menu, LogOut, Wand2, LayoutDashboard } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWizard } from '../../features/simulations/context/WizardContext';
import LogoutConfirmationModal from '../common/LogoutConfirmationModal';
import Logo from '../../assets/co_tutor_new_logo.png';
import NavLinks from './Header/NavLinks';
import MobileMenu from './Header/MobileMenu';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { logout } = useAuth();
  const { viewMode, setViewMode } = useWizard();

  return (
    <header className="bg-white border-b border-slate-200 py-2 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-20 h-[53px]">
      <div className="flex-1 flex items-center justify-start">
        <NavLink to="/" className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity">
          <img src={Logo} alt="Co-Tutor Admin" className="h-[33px] w-auto object-contain shrink-0" />
          <div className="flex flex-col justify-center mt-1">
            <h1 className="text-xl font-extrabold text-[#62748d] tracking-tight leading-none mb-0.5">Co-Tutor</h1>
            <p className="text-[10px] text-primary-600 font-bold uppercase tracking-wider">Admin Portal</p>
          </div>
        </NavLink>
      </div>
      
      {/* Center Desktop Nav */}
      <div className="hidden lg:flex items-center justify-center">
        <nav className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <NavLinks onLinkClick={() => setIsMenuOpen(false)} />
        </nav>
      </div>

      <div className="flex-1 flex items-center justify-end gap-2">
        {/* Wizard Mode Toggle */}
        <div className="flex bg-slate-100 sm:bg-white rounded-md p-0.5 sm:border sm:border-slate-200 shadow-sm">
          <button
            onClick={() => setViewMode('classic')}
            aria-label="Classic view"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded text-xs font-bold transition-all ${viewMode === 'classic' ? 'bg-white sm:bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200 sm:hover:bg-slate-50'}`}
            title="Classic View"
          >
            <LayoutDashboard className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Classic</span>
          </button>
          <button
            onClick={() => setViewMode('wizard')}
            aria-label="Wizard view"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded text-xs font-bold transition-all ${viewMode === 'wizard' ? 'bg-white sm:bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200 sm:hover:bg-slate-50'}`}
            title="Wizard View"
          >
            <Wand2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Wizard</span>
          </button>
        </div>

        {/* Desktop Logout */}
        <button 
          onClick={() => setIsLogoutModalOpen(true)}
          className="hidden lg:flex cursor-pointer items-center whitespace-nowrap shrink-0 gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-red-600 bg-red-50 hover:bg-red-100"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>

        {/* Hamburger Toggle (Mobile Only) */}
        <button 
          className="lg:hidden cursor-pointer p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
          onClick={() => setIsMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Menu Component */}
      <MobileMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onLogoutClick={() => setIsLogoutModalOpen(true)} 
      />

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

