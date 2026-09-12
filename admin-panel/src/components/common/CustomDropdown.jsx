import { useState, useRef, useEffect } from 'react';
import * as Icons from 'lucide-react';

export default function CustomDropdown({ 
  icon: IconComponent = Icons.BookOpen,
  items = [], 
  selectedId, 
  onSelect, 
  placeholder = 'Select an item' 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedItemObj = items.find(i => i.id === selectedId) || items[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-slate-50 border text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all cursor-pointer ${
          isOpen ? 'border-primary-500 ring-1 ring-primary-100' : 'border-slate-300 hover:border-primary-400'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="p-1 rounded-md bg-indigo-50 text-indigo-600 shrink-0">
            <IconComponent className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-800 truncate">{selectedItemObj?.name || placeholder}</span>
        </div>
        <Icons.ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1 transform opacity-100 scale-100 origin-top transition-all animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
          {items.map((item) => {
            const isSelected = selectedId === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelect(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-5 py-2 transition-colors text-left cursor-pointer ${
                  isSelected 
                    ? 'bg-primary-50 text-primary-900' 
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`p-1 rounded-md shrink-0 ${isSelected ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <IconComponent className="w-3.5 h-3.5" />
                </div>
                <span className={`text-xs font-semibold truncate flex-1 min-w-0 ${isSelected ? 'text-primary-900' : 'text-slate-700'}`}>
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
