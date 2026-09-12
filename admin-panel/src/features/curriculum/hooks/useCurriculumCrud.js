import { toast } from 'sonner';
import {
  useClasses, useCreateClass, useUpdateClass, useDeleteClass,
  useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject,
  useChapters, useCreateChapter, useUpdateChapter, useDeleteChapter
} from '../../simulations/hooks/useCategories';
import { validateCategory } from '../utils/curriculumValidation';

export function useCurriculumCrud({ modalType, editingItem, deleteState, closeModal, closeDeleteModal }) {
  const { data: classes = [], isLoading: isLoadingClasses } = useClasses();
  const { data: allSubjects = [], isLoading: isLoadingSubjects } = useSubjects(null);
  const { data: allChapters = [], isLoading: isLoadingChapters } = useChapters(null);

  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();

  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();

  const createChapter = useCreateChapter();
  const updateChapter = useUpdateChapter();
  const deleteChapter = useDeleteChapter();

  const handleSaveCategory = async (data) => {
    try {
      const isValid = validateCategory({ modalType, data, editingItem, classes, allSubjects, allChapters });
      if (!isValid) return;

      if (modalType === 'Class') {
        if (editingItem) await updateClass.mutateAsync({ id: editingItem.id, ...data });
        else await createClass.mutateAsync(data);
      } else if (modalType === 'Subject') {
        if (editingItem) await updateSubject.mutateAsync({ id: editingItem.id, ...data });
        else await createSubject.mutateAsync(data);
      } else if (modalType === 'Chapter') {
        if (editingItem) await updateChapter.mutateAsync({ id: editingItem.id, ...data });
        else await createChapter.mutateAsync(data);
      }

      toast.success(`${modalType} ${editingItem ? 'updated' : 'created'} successfully!`);
      closeModal();
    } catch (error) {
      toast.error(`Failed to save ${modalType}: ${error.message}`);
    }
  };

  const confirmDelete = async () => {
    try {
      const { id, type } = deleteState;
      if (type === 'Class') await deleteClass.mutateAsync(id);
      if (type === 'Subject') await deleteSubject.mutateAsync(id);
      if (type === 'Chapter') await deleteChapter.mutateAsync(id);
      
      toast.success(`${type} deleted successfully!`);
      closeDeleteModal();
    } catch (error) {
      toast.error(`Failed to delete ${deleteState.type}: ${error.message}`);
    }
  };

  const isSaving = 
    createClass.isPending || updateClass.isPending || deleteClass.isPending ||
    createSubject.isPending || updateSubject.isPending || deleteSubject.isPending ||
    createChapter.isPending || updateChapter.isPending || deleteChapter.isPending;

  return {
    classes, isLoadingClasses,
    allSubjects, isLoadingSubjects,
    allChapters, isLoadingChapters,
    handleSaveCategory,
    confirmDelete,
    isSaving
  };
}
