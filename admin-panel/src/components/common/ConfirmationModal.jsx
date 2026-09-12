import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Are you sure?', 
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isPending = false
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
        onClick={isPending ? undefined : onClose}
      />
      
      <div className="w-full max-w-[320px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/50 p-5 relative z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        {/* Subtle top gradient */}
        <div className={`absolute top-0 left-0 w-full h-24 bg-linear-to-b ${isDestructive ? 'from-red-50/50' : 'from-primary-50/50'} to-transparent pointer-events-none rounded-t-2xl`}></div>

        <div className="relative">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 bg-linear-to-br ${isDestructive ? 'from-red-100 to-red-50 border-red-100/50' : 'from-primary-100 to-primary-50 border-primary-100/50'} rounded-xl flex items-center justify-center shrink-0 shadow-sm border`}>
              <AlertTriangle className={`w-5 h-5 ${isDestructive ? 'text-red-600' : 'text-primary-600'}`} />
            </div>
            <button
              onClick={onClose}
              disabled={isPending}
              aria-label="Close"
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer focus:outline-none bg-white/50 backdrop-blur-sm disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <h3 className="text-base font-bold text-slate-800 mb-1 tracking-tight">{title}</h3>
          <p className="text-[13px] text-slate-500 mb-5 leading-relaxed">
            {message}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isPending}
              className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold rounded-xl transition-colors focus:outline-none cursor-pointer disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className={`flex-1 px-3 py-2 text-white text-[13px] font-bold rounded-xl shadow-sm hover:shadow transition-colors focus:outline-none cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              {isPending && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
