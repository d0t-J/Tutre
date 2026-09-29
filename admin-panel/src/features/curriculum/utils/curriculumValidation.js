import { toast } from 'sonner';

/**
 * Validates uniqueness of category names and chapter numbers.
 * Returns true if valid, or false if validation failed (and displays a toast error).
 */
export function validateCategory({ modalType, data, editingItem, classes, allSubjects, allChapters }) {
  if (modalType === 'Class') {
    const isDuplicate = classes.some(
      c => c.name.toLowerCase() === data.name.toLowerCase() && c.id !== editingItem?.id
    );
    if (isDuplicate) {
      toast.error(`A Class named "${data.name}" already exists.`);
      return false;
    }
  } else if (modalType === 'Subject') {
    const isDuplicate = allSubjects.some(
      c => c.name.toLowerCase() === data.name.toLowerCase() && c.class_id === data.class_id && c.id !== editingItem?.id
    );
    if (isDuplicate) {
      toast.error(`A Subject named "${data.name}" already exists in this Class.`);
      return false;
    }
  } else if (modalType === 'Chapter') {
    const isDuplicate = allChapters.some(
      c => c.name.toLowerCase() === data.name.toLowerCase() && c.subject_id === data.subject_id && c.id !== editingItem?.id
    );
    if (isDuplicate) {
      toast.error(`A Chapter named "${data.name}" already exists in this Subject.`);
      return false;
    }
    
    const isDuplicateNumber = allChapters.some(
      c => c.chapter_no === data.chapter_no && c.subject_id === data.subject_id && c.id !== editingItem?.id
    );
    if (isDuplicateNumber) {
      toast.error(`Chapter Number ${data.chapter_no} is already assigned to another Chapter in this Subject.`);
      return false;
    }
  }
  return true;
}
