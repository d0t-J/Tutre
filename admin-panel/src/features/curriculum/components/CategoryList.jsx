import { useMemo } from 'react';
import ClassListRenderer from './ClassListRenderer';
import SubjectListRenderer from './SubjectListRenderer';
import ChapterListRenderer from './ChapterListRenderer';

export default function CategoryList({ 
  items = [], 
  type, // 'Class', 'Subject', 'Chapter'
  parentOptions = [], 
  grandparentOptions = [],
  onAdd, 
  onEdit, 
  onDelete,
  isLoading
}) {
  const groupedItems = useMemo(() => {
    if (type === 'Class') return null;
    const groups = {};
    items.forEach(item => {
      const parentId = type === 'Subject' ? item.class_id : item.subject_id;
      const key = parentId || 'uncategorized';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [items, type]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 content-start">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="bg-slate-50 border border-slate-100 rounded-xl h-28 animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (type === 'Class') {
    return <ClassListRenderer items={items} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} />;
  }

  if (type === 'Subject') {
    return (
      <SubjectListRenderer 
        parentOptions={parentOptions} 
        groupedItems={groupedItems} 
        onAdd={onAdd} 
        onEdit={onEdit} 
        onDelete={onDelete} 
      />
    );
  }

  return (
    <ChapterListRenderer 
      parentOptions={parentOptions} 
      grandparentOptions={grandparentOptions} 
      groupedItems={groupedItems} 
      onAdd={onAdd} 
      onEdit={onEdit} 
      onDelete={onDelete} 
    />
  );
}
