import { useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import CategoryFormFields from './CategoryFormFields';

export default function CategoryForm({
  type,
  initialData,
  initialParentId,
  isPending,
  onClose,
  onSubmit,
}) {
  const [name, setName] = useState(() => initialData?.name || '');
  const parentId = (() => {
    if (initialData) {
      if (type === 'Subject') return initialData.class_id || '';
      if (type === 'Chapter') return initialData.subject_id || '';
    }
    return initialParentId || '';
  })();
  const [chapterNo, setChapterNo] = useState(() => {
    if (initialData && type === 'Chapter' && initialData.chapter_no != null) {
      return String(initialData.chapter_no);
    }
    return '';
  });

  const isEditing = !!initialData;
  const parentLabel = type === 'Subject' ? 'Class' : 'Subject';
  const parentKey = type === 'Subject' ? 'class_id' : 'subject_id';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (type !== 'Class' && !parentId) {
      toast.error(`Please select a ${parentLabel}`);
      return;
    }

    const data = { name: name.trim() };
    if (type !== 'Class') data[parentKey] = parentId;
    if (type === 'Chapter') data.chapter_no = chapterNo ? parseInt(chapterNo, 10) : 0;

    try {
      await onSubmit(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save: ' + (error?.message || 'Please try again.'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <CategoryFormFields
        type={type}
        name={name}
        setName={setName}
        chapterNo={chapterNo}
        setChapterNo={setChapterNo}
        isPending={isPending}
      />

      <div className="flex items-center gap-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors focus:outline-none cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow transition-colors focus:outline-none cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isPending ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isEditing ? 'Save Changes' : 'Create'}
        </button>
      </div>
    </form>
  );
}
