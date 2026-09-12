import * as Icons from 'lucide-react';

export default function EmptyState({ 
  title = "No simulations found", 
  message = "We couldn't find any simulations matching your criteria.",
  iconName = "FolderSearch"
}) {
  const Icon = Icons[iconName] || Icons.FolderSearch;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm text-center">
      <div className="w-16 h-16 bg-slate-100/50 rounded-2xl flex items-center justify-center mb-5 border border-slate-100">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1.5">{title}</h3>
      <p className="text-[13px] text-slate-500 max-w-sm leading-relaxed">
        {message}
      </p>
    </div>
  );
}
