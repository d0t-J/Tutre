import { useEffect } from 'react';
import * as Icons from 'lucide-react';
import { DropdownSkeleton } from '../../../components/common/SkeletonLoaders';
import { useSimulation } from '../context/SimulationContext';
import { useChapters } from '../hooks/useCategories';
import CustomDropdown from '../../../components/common/CustomDropdown';

export default function ChapterSelector() {
  const { selectedSubject, selectedChapter, setSelectedChapter } = useSimulation();
  const { data: chapters, isLoading } = useChapters(selectedSubject);

  // Set default selectedChapter when data loads
  useEffect(() => {
    if (chapters && chapters.length > 0) {
      if (!selectedChapter || !chapters.find(c => c.id === selectedChapter)) {
        setSelectedChapter(chapters[0].id);
      }
    } else {
      setSelectedChapter(null);
    }
  }, [chapters, selectedSubject, selectedChapter, setSelectedChapter]);

  if (isLoading || !selectedSubject) {
    return <DropdownSkeleton number="3" label="Choose Chapter" />;
  }

  if (!chapters || chapters.length === 0) {
    return (
      <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 relative opacity-50 cursor-not-allowed">
        <h2 className="text-xs sm:text-base whitespace-nowrap font-bold text-slate-800 mb-1.5 flex items-center gap-1.5 sm:gap-2">
          <span className="bg-slate-100 text-slate-600 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] shrink-0">3</span>
          Choose Chapter
        </h2>
        <div className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
          <span className="text-xs font-bold text-slate-500">No chapters found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 relative">
      <h2 className="text-xs sm:text-base whitespace-nowrap font-bold text-slate-800 mb-1.5 flex items-center gap-1.5 sm:gap-2">
        <span className="bg-slate-100 text-slate-600 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] shrink-0">3</span>
        Choose Chapter
      </h2>
      <CustomDropdown
        icon={Icons.BookOpen}
        items={chapters}
        selectedId={selectedChapter}
        onSelect={setSelectedChapter}
        placeholder="Select a chapter"
      />
    </div>
  );
}
