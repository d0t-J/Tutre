import { useState, useRef, useEffect } from 'react';
import * as Icons from 'lucide-react';
import FilterDropdownMenu from './FilterDropdownMenu';

export default function FilterDropdown({ options, value, onChange, placeholder, defaultIcon = "LayoutGrid", disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(o => o.id === value);
  const SelectedIcon = Icons[selectedOption?.icon_name || defaultIcon] || Icons[defaultIcon] || Icons.LayoutGrid;

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
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between border text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all h-9 sm:h-10 ${
          disabled ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50' : 'cursor-pointer bg-slate-50 ' + (isOpen ? 'border-primary-500 ring-1 ring-primary-100' : 'border-slate-300 hover:border-primary-400')
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className={`p-1 rounded-md shrink-0 ${!selectedOption ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-600'}`}>
            <SelectedIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <span className={`text-xs font-bold truncate ${!selectedOption ? 'text-slate-500' : 'text-slate-800'}`}>
            {selectedOption ? selectedOption.name : placeholder}
          </span>
        </div>
        <Icons.ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <FilterDropdownMenu 
          options={options} 
          value={value} 
          onChange={onChange} 
          setIsOpen={setIsOpen} 
          placeholder={placeholder} 
          defaultIcon={defaultIcon} 
        />
      )}
    </div>
  );
}
