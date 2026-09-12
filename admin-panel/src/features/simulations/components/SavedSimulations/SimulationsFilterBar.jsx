import { Database, Search } from 'lucide-react';
import FilterDropdown from '../../../../components/common/FilterDropdown';

export default function SimulationsFilterBar({
  searchQuery,
  setSearchQuery,
  classes,
  selectedClassId,
  setSelectedClassId,
  subjects,
  selectedSubjectId,
  setSelectedSubjectId,
  chapters,
  selectedChapterId,
  setSelectedChapterId,
  setPage
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-2">
        <div className="bg-slate-100 p-1.5 rounded-lg text-slate-600">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">Saved Simulations</h2>
          <p className="text-xs text-slate-500 font-medium">Click any simulation below to load it into the preview area.</p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row items-center gap-3 w-full lg:w-auto">
        {/* Search Bar */}
        <div className="relative w-full xl:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 xl:flex w-full xl:w-auto gap-2">
          <div className="col-span-1 xl:w-40 z-30">
            <FilterDropdown
              options={classes}
              value={selectedClassId}
              onChange={(val) => {
                setSelectedClassId(val);
                setSelectedSubjectId('');
                setSelectedChapterId('');
                setPage(1);
              }}
              placeholder="All Classes"
              defaultIcon="GraduationCap"
            />
          </div>

          <div className="col-span-1 xl:w-40 z-20">
            <FilterDropdown
              options={subjects}
              value={selectedSubjectId}
              onChange={(val) => {
                setSelectedSubjectId(val);
                setSelectedChapterId('');
                setPage(1);
              }}
              placeholder={selectedClassId ? 'All Subjects' : 'Select Class First'}
              defaultIcon="Book"
              disabled={!selectedClassId}
            />
          </div>

          <div className="col-span-2 xl:col-span-1 xl:w-64 2xl:w-80 z-10">
            <FilterDropdown
              options={chapters}
              value={selectedChapterId}
              onChange={(val) => {
                setSelectedChapterId(val);
                setPage(1);
              }}
              placeholder={selectedSubjectId ? 'All Chapters' : 'Select Subject First'}
              defaultIcon="BookOpen"
              disabled={!selectedSubjectId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
