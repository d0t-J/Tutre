import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useClasses, useSubjects, useChapters } from '../hooks/useCategories';
import { useSimulations } from '../hooks/useSimulations';
import SimulationsFilterBar from './SavedSimulations/SimulationsFilterBar';
import SimulationsGrid from './SavedSimulations/SimulationsGrid';

export default function SavedSimulations({ loadSavedSimulation, deleteSimulation }) {
  const [page, setPage] = useState(1);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects(selectedClassId || null);
  const { data: chapters = [] } = useChapters(selectedSubjectId || null);

  const { data, isLoading, isError } = useSimulations(
    page, 
    20, 
    selectedSubjectId || null, 
    selectedClassId || null, 
    debouncedSearch,
    selectedChapterId || null
  );

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset page on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const savedSimulations = data?.data || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="bg-white p-3 sm:p-5 rounded-none sm:rounded-2xl shadow-sm border-0 sm:border border-slate-100 h-full flex flex-col">
      <SimulationsFilterBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        classes={classes}
        selectedClassId={selectedClassId}
        setSelectedClassId={setSelectedClassId}
        subjects={subjects}
        selectedSubjectId={selectedSubjectId}
        setSelectedSubjectId={setSelectedSubjectId}
        chapters={chapters}
        selectedChapterId={selectedChapterId}
        setSelectedChapterId={setSelectedChapterId}
        setPage={setPage}
      />

      <div className="flex-1">
        <SimulationsGrid 
          isLoading={isLoading}
          isError={isError}
          savedSimulations={savedSimulations}
          loadSavedSimulation={loadSavedSimulation}
          deleteSimulation={deleteSimulation}
        />
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-6">
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Previous page"
              className="cursor-pointer p-1.5 sm:p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label="Next page"
              className="cursor-pointer p-1.5 sm:p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
