import CategoryList from './CategoryList';

export default function CurriculumTabContent({
  activeTab,
  classes,
  isLoadingClasses,
  allSubjects,
  isLoadingSubjects,
  allChapters,
  isLoadingChapters,
  openModal,
  handleDeleteClick
}) {
  return (
    <div className="mt-4 sm:mt-6">
      {activeTab === 'classes' && (
        <CategoryList 
          type="Class" 
          items={classes} 
          isLoading={isLoadingClasses}
          onAdd={() => openModal('Class')}
          onEdit={(item) => openModal('Class', item)}
          onDelete={(id) => handleDeleteClick(id, 'Class', classes.find(c => c.id === id)?.name)}
        />
      )}
      {activeTab === 'subjects' && (
        <CategoryList 
          type="Subject" 
          items={allSubjects} 
          isLoading={isLoadingSubjects}
          onAdd={(parentId) => openModal('Subject', null, parentId)}
          onEdit={(item) => openModal('Subject', item)}
          onDelete={(id) => handleDeleteClick(id, 'Subject', allSubjects.find(s => s.id === id)?.name)}
          parentOptions={classes}
        />
      )}
      {activeTab === 'chapters' && (
        <CategoryList 
          type="Chapter" 
          items={allChapters} 
          isLoading={isLoadingChapters}
          onAdd={(parentId) => openModal('Chapter', null, parentId)}
          onEdit={(item) => openModal('Chapter', item)}
          onDelete={(id) => handleDeleteClick(id, 'Chapter', allChapters.find(c => c.id === id)?.name)}
          parentOptions={allSubjects}
          grandparentOptions={classes}
        />
      )}
    </div>
  );
}
