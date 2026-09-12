import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function MobileDropdown({ 
  label, 
  icon: Icon, 
  options, 
  selectedValue, 
  onSelect, 
  placeholder = "Select Option",
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(o => o.value === selectedValue);

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
    <div className={`bg-white p-2 rounded-xl shadow-sm border border-slate-200 relative ${className}`} ref={dropdownRef}>
      {label && (
        <h2 className="text-xs sm:text-base whitespace-nowrap font-bold text-slate-800 mb-1.5 flex items-center gap-1.5 sm:gap-2">
          {label}
        </h2>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between bg-slate-50 border text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all cursor-pointer ${
            isOpen ? 'border-primary-500 ring-1 ring-primary-100' : 'border-slate-300 hover:border-primary-400'
          }`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {Icon && (
              <div className="p-1 rounded-md bg-primary-50 text-primary-600 shrink-0">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <span className="text-xs font-bold text-slate-800 truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1 transform opacity-100 scale-100 origin-top transition-all animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
            {options.map((opt) => {
              const isSelected = selectedValue === opt.value;
              
              return (
                <button
                  key={opt.value ?? 'null-val'}
                  onClick={() => {
                    onSelect(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 transition-colors text-left cursor-pointer ${
                    isSelected 
                      ? 'bg-primary-50 text-primary-900' 
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {Icon && (
                    <div className={`p-1 rounded-md shrink-0 ${isSelected ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <span className={`text-xs font-semibold truncate ${isSelected ? 'text-primary-900' : 'text-slate-700'}`}>
                    {opt.label}
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
