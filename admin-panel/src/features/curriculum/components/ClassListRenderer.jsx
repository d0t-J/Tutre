import { Plus } from 'lucide-react';
import CategoryCard from './CategoryCard';
import CategoryEmptyState from './CategoryEmptyState';

export default function ClassListRenderer({ items, onAdd, onEdit, onDelete }) {
  if (items.length === 0) return <CategoryEmptyState type="Class" />;
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-start mb-2">
        <button
          onClick={() => onAdd()}
          className="flex items-center gap-1 px-2.5 py-1.5 text-primary-600 hover:bg-primary-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Class
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 content-start">
        {items.map(item => (
          <CategoryCard key={item.id} item={item} type="Class" onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
