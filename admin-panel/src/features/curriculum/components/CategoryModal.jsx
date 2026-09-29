import { createPortal } from 'react-dom';
import { X, Layers, Book, Library } from 'lucide-react';
import CategoryForm from './CategoryForm';

export default function CategoryModal({ 
  isOpen, 
  onClose, 
  type, // 'Class', 'Subject', 'Chapter'
  initialData = null, 
  initialParentId = null,
  onSubmit, 
  isPending
}) {
  if (!isOpen) return null;

  const isEditing = !!initialData;
  const title = `${isEditing ? 'Edit' : 'Create'} ${type}`;
  
  const getIcon = () => {
    if (type === 'Class') return <Layers className="w-5 h-5 text-primary-600 ml-0.5" />;
    if (type === 'Subject') return <Book className="w-5 h-5 text-primary-600 ml-0.5" />;
    return <Library className="w-5 h-5 text-primary-600 ml-0.5" />;
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
        onClick={isPending ? undefined : onClose}
      />
      
      <div className="w-full max-w-100 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/50 p-6 relative z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        {/* Subtle top gradient */}
        <div className="absolute top-0 left-0 w-full h-24 bg-linear-to-b from-primary-50/50 to-transparent pointer-events-none rounded-t-2xl"></div>

        <div className="relative">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-primary-100 to-primary-50 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-primary-100/50">
                {getIcon()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h3>
              </div>
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
          
          <CategoryForm 
            type={type}
            initialData={initialData}
            initialParentId={initialParentId}
            isPending={isPending}
            onClose={onClose}
            onSubmit={onSubmit}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
