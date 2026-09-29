import CategoryModal from '../../features/curriculum/components/CategoryModal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { CurriculumSkeleton } from '../../components/common/loaders/CurriculumSkeleton';
import { useCurriculumState } from '../../features/curriculum/hooks/useCurriculumState';
import { useCurriculumCrud } from '../../features/curriculum/hooks/useCurriculumCrud';
import CurriculumHeader from '../../features/curriculum/components/CurriculumHeader';
import CurriculumTabs from '../../features/curriculum/components/CurriculumTabs';
import CurriculumTabContent from '../../features/curriculum/components/CurriculumTabContent';

export default function CurriculumManager() {
  const {
    activeTab, setActiveTab,
    isModalOpen, modalType, editingItem, initialParentId,
    deleteState,
    openModal, closeModal,
    handleDeleteClick, closeDeleteModal
  } = useCurriculumState();

  const {
    classes, isLoadingClasses,
    allSubjects, isLoadingSubjects,
    allChapters, isLoadingChapters,
    handleSaveCategory,
    confirmDelete,
    isSaving
  } = useCurriculumCrud({ modalType, editingItem, deleteState, closeModal, closeDeleteModal });

  if (isLoadingClasses || isLoadingSubjects || isLoadingChapters) {
    return <CurriculumSkeleton />;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="bg-white p-3 sm:p-5 rounded-none sm:rounded-2xl shadow-sm border-0 sm:border border-slate-100 h-full flex flex-col min-h-0">
        <CurriculumHeader />
        
        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-1 sm:pr-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-2 sm:p-4 mb-4 sm:mb-6">
            <CurriculumTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <CurriculumTabContent
              activeTab={activeTab}
              classes={classes}
              isLoadingClasses={isLoadingClasses}
              allSubjects={allSubjects}
              isLoadingSubjects={isLoadingSubjects}
              allChapters={allChapters}
              isLoadingChapters={isLoadingChapters}
              openModal={openModal}
              handleDeleteClick={handleDeleteClick}
            />
          </div>
        </div>

        <CategoryModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSubmit={handleSaveCategory}
          type={modalType}
          initialData={editingItem}
          parentOptions={modalType === 'Subject' ? classes : allSubjects}
          isPending={isSaving}
          initialParentId={initialParentId}
        />

        <ConfirmationModal
          isOpen={deleteState.isOpen}
          onClose={closeDeleteModal}
          onConfirm={confirmDelete}
          title={`Delete ${deleteState.type}`}
          message={`Are you sure you want to delete "${deleteState.itemName}"? This action cannot be undone and will permanently remove all associated data.`}
          confirmText="Delete"
          isDestructive={true}
          isPending={isSaving}
        />
      </div>
    </div>
  );
}
