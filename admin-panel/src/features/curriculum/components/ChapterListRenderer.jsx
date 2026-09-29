import { Layers, Plus, Book } from 'lucide-react';
import * as Icons from 'lucide-react';
import CategoryCard from './CategoryCard';
import CategoryEmptyState from './CategoryEmptyState';

export default function ChapterListRenderer({ parentOptions, grandparentOptions, groupedItems, onAdd, onEdit, onDelete }) {
  if (parentOptions.length === 0) return <CategoryEmptyState type="Chapter" reason="no_parents" />;
  
  return (
    <div className="flex flex-col gap-10">
      {grandparentOptions.map(grandparent => {
        const subjectsInClass = parentOptions.filter(p => p.class_id === grandparent.id);
        if (subjectsInClass.length === 0) return null;
        
        return (
          <div key={grandparent.id} className="flex flex-col gap-5">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 pb-2 border-b-2 border-slate-200">
              <Layers className="w-5 h-5 text-slate-400" />
              {grandparent.name}
            </h3>
            
            <div className="flex flex-col gap-8 pl-3 sm:pl-5 border-l-2 border-slate-100 ml-2">
              {subjectsInClass.map(parent => {
                const groupItems = groupedItems[parent.id] || [];
                
                return (
                  <div key={parent.id} className="flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        {(() => {
                          const SubjectIcon = parent?.icon_name && Icons[parent.icon_name] ? Icons[parent.icon_name] : Book;
                          return <SubjectIcon className="w-4 h-4 text-slate-400" />;
                        })()}
                        {parent.name}
                      </h4>
                      <button
                        onClick={() => onAdd(parent.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-primary-600 hover:bg-primary-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Chapter
                      </button>
                    </div>
                    {groupItems.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 content-start">
                        {groupItems.map(item => (
                          <CategoryCard key={item.id} item={item} type="Chapter" onEdit={onEdit} onDelete={onDelete} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 p-5 border border-dashed border-slate-200 rounded-xl text-center">
                        No chapters added to {parent.name} yet.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
