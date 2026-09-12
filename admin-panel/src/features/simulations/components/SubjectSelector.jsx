import { useState, useRef, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { DropdownSkeleton } from '../../../components/common/SkeletonLoaders';
import { useSimulation } from '../context/SimulationContext';

const COLORS = [
  { color: 'text-blue-600', bg: 'bg-blue-50' },
  { color: 'text-orange-600', bg: 'bg-orange-50' },
  { color: 'text-green-600', bg: 'bg-green-50' },
  { color: 'text-purple-600', bg: 'bg-purple-50' },
  { color: 'text-red-600', bg: 'bg-red-50' },
];

export default function SubjectSelector() {
  const { subjects, selectedSubject, setSelectedSubject } = useSimulation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedSubjectObj = subjects.find(s => s.id === selectedSubject) || subjects[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!subjects || subjects.length === 0) {
    return <DropdownSkeleton number="2" label="Choose Subject" />;
  }

  // Fallback to default icon if not found
  const SelectedIcon = Icons[selectedSubjectObj?.icon_name] || Icons.Book;

  return (
    <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 relative" ref={dropdownRef}>
      <h2 className="text-xs sm:text-base whitespace-nowrap font-bold text-slate-800 mb-1.5 flex items-center gap-1.5 sm:gap-2">
        <span className="bg-slate-100 text-slate-600 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] shrink-0">2</span>
        Choose Subject
      </h2>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between bg-slate-50 border text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all cursor-pointer ${
            isOpen ? 'border-primary-500 ring-1 ring-primary-100' : 'border-slate-300 hover:border-primary-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded-md ${COLORS[0].bg} ${COLORS[0].color}`}>
              <SelectedIcon className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800">{selectedSubjectObj?.name}</span>
          </div>
          <Icons.ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1 transform opacity-100 scale-100 origin-top transition-all animate-in fade-in zoom-in-95 duration-100">
            {subjects.map((sub, index) => {
              const Icon = Icons[sub.icon_name] || Icons.Book;
              const isSelected = selectedSubject === sub.id;
              const colorTheme = COLORS[index % COLORS.length];
              
              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    setSelectedSubject(sub.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-5 py-2 transition-colors text-left cursor-pointer ${
                    isSelected 
                      ? 'bg-primary-50 text-primary-900' 
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className={`p-1 rounded-md ${isSelected ? 'bg-primary-600 text-white' : colorTheme.bg + ' ' + colorTheme.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-xs font-semibold ${isSelected ? 'text-primary-900' : 'text-slate-700'}`}>
                    {sub.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
