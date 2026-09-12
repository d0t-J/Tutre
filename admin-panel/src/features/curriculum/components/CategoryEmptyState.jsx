import { Layers, Book, Library } from 'lucide-react';

export default function CategoryEmptyState({ type, reason }) {
  const getIcon = () => {
    if (type === 'Class') return <Layers className="w-4 h-4" />;
    if (type === 'Subject') return <Book className="w-4 h-4" />;
    return <Library className="w-4 h-4" />;
  };

  const getMessage = () => {
    if (reason === 'no_parents') {
      if (type === 'Subject') return 'You need to create a Class before you can add Subjects.';
      if (type === 'Chapter') return 'You need to create a Subject before you can add Chapters.';
    }
    return `Get started by creating your first ${type.toLowerCase()}.`;
  };

  const getTitle = () => {
    if (reason === 'no_parents') {
      if (type === 'Subject') return 'No Classes Found';
      if (type === 'Chapter') return 'No Subjects Found';
    }
    return `No ${type}es Found`;
  };

  return (
    <div className="text-center py-12 bg-slate-50 border border-slate-100 rounded-xl border-dashed">
      <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-3 text-primary-500">
        {getIcon()}
      </div>
      <h4 className="text-sm font-bold text-slate-700 mb-1">{getTitle()}</h4>
      <p className="text-xs text-slate-500">{getMessage()}</p>
    </div>
  );
}
