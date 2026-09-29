import * as Icons from 'lucide-react';
const { Edit2, Trash2, Layers, Book, Library } = Icons;

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(dateString));
};

export default function CategoryCard({ item, type, onEdit, onDelete }) {
  const getIcon = () => {
    if (type === 'Class') return <Layers className="w-4 h-4" />;
    if (type === 'Subject') {
      const IconComponent = item?.icon_name && Icons[item.icon_name] ? Icons[item.icon_name] : Book;
      return <IconComponent className="w-4 h-4" />;
    }
    return <Library className="w-4 h-4" />;
  };

  return (
    <div className="flex flex-col text-left bg-white border-2 border-slate-100 p-2 sm:p-3.5 rounded-xl hover:border-primary-300 hover:shadow-lg transition-all group h-full">
      <div className="flex items-center gap-2 mb-3 overflow-hidden w-full relative">
        <div className="p-1.5 rounded-lg bg-primary-50 text-primary-600 shrink-0">
          {getIcon()}
        </div>
        
        <h3 className="text-sm font-bold text-slate-800 group-hover:text-primary-600 transition-colors truncate pr-2 flex items-center gap-1.5">
          {type === 'Chapter' && item.chapter_no !== undefined && item.chapter_no !== null && (
            <span className="text-xs font-semibold bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-md">
              #{item.chapter_no}
            </span>
          )}
          <span className="truncate">{item.name}</span>
        </h3>
        
        <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100 pl-1">
          <button 
            onClick={() => onEdit(item)}
            className="cursor-pointer p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            title={`Edit ${type}`}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(item.id)}
            className="cursor-pointer p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            title={`Delete ${type}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-[9px] sm:text-xs text-slate-400 mt-auto pt-1.5 sm:pt-2 border-t border-slate-100 w-full truncate">
        Added: {formatDate(item.created_at)}
      </p>
    </div>
  );
}
