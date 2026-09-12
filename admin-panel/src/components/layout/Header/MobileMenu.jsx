import { X, LogOut } from 'lucide-react';
import NavLinks from './NavLinks';

export default function MobileMenu({ isOpen, onClose, onLogoutClick }) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 flex items-center justify-between border-b border-slate-100">
          <h2 className="font-extrabold text-sm text-slate-800">Menu</h2>
          <button onClick={onClose} className="cursor-pointer p-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-2 p-4">
          <NavLinks onLinkClick={onClose} />
          <div className="mt-4 border-t border-slate-100 pt-4">
            <button 
              onClick={() => {
                onClose();
                onLogoutClick();
              }}
              className="cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-xs font-bold transition-all text-red-600 bg-red-50 hover:bg-red-100"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}
