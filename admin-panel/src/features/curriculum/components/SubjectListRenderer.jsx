import { Layers, Plus } from 'lucide-react';
import CategoryCard from './CategoryCard';
import CategoryEmptyState from './CategoryEmptyState';

export default function SubjectListRenderer({ parentOptions, groupedItems, onAdd, onEdit, onDelete }) {
  if (parentOptions.length === 0) return <CategoryEmptyState type="Subject" reason="no_parents" />;
  
  return (
    <div className="flex flex-col gap-8">
      {parentOptions.map(parent => {
        const groupItems = groupedItems[parent.id] || [];
        return (
          <div key={parent.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-400" />
                {parent.name}
              </h4>
              <button
                onClick={() => onAdd(parent.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-primary-600 hover:bg-primary-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Subject
              </button>
            </div>
            {groupItems.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 content-start">
                {groupItems.map(item => (
                  <CategoryCard key={item.id} item={item} type="Subject" onEdit={onEdit} onDelete={onDelete} />
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 p-6 border border-dashed border-slate-200 rounded-xl text-center">
                No subjects added to {parent.name} yet.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
