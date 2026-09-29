import { createPortal } from 'react-dom';
import { LogOut, X } from 'lucide-react';

export default function LogoutConfirmationModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="w-full max-w-75 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/50 p-5 relative z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        {/* Subtle top gradient */}
        <div className="absolute top-0 left-0 w-full h-24 bg-linear-to-b from-primary-50/50 to-transparent pointer-events-none rounded-t-2xl"></div>

        <div className="relative">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-linear-to-br from-primary-100 to-primary-50 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-primary-100/50">
              <LogOut className="w-5 h-5 text-primary-600 ml-0.5" />
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer focus:outline-none bg-white/50 backdrop-blur-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <h3 className="text-base font-bold text-slate-800 mb-1 tracking-tight">Sign Out</h3>
          <p className="text-[13px] text-slate-500 mb-5 leading-relaxed">
            Are you sure you want to end your session?
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold rounded-xl transition-colors focus:outline-none cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-[13px] font-bold rounded-xl shadow-sm hover:shadow transition-colors focus:outline-none cursor-pointer flex items-center justify-center gap-1.5"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
