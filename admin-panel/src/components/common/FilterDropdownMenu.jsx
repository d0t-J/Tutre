import * as Icons from 'lucide-react';

const COLORS = [
  { color: 'text-blue-600', bg: 'bg-blue-50' },
  { color: 'text-orange-600', bg: 'bg-orange-50' },
  { color: 'text-green-600', bg: 'bg-green-50' },
  { color: 'text-purple-600', bg: 'bg-purple-50' },
  { color: 'text-red-600', bg: 'bg-red-50' },
];

export default function FilterDropdownMenu({ options, value, onChange, setIsOpen, placeholder, defaultIcon }) {
  const DefaultIcon = Icons[defaultIcon] || Icons.LayoutGrid;

  return (
    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1 transform opacity-100 scale-100 origin-top transition-all animate-in fade-in zoom-in-95 duration-100 max-h-75 overflow-y-auto">
      <button
        onClick={() => {
          onChange('');
          setIsOpen(false);
        }}
        className={`w-full flex items-center gap-2.5 px-4 py-2 transition-colors text-left cursor-pointer ${
          !value ? 'bg-primary-50 text-primary-900' : 'hover:bg-slate-50 text-slate-700'
        }`}
      >
        <div className={`p-1 rounded-md shrink-0 ${!value ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
          <DefaultIcon className="w-3.5 h-3.5" />
        </div>
        <span className={`text-xs font-semibold ${!value ? 'text-primary-900' : 'text-slate-700'}`}>
          {placeholder}
        </span>
      </button>
      
      {options.map((opt, index) => {
        const Icon = Icons[opt.icon_name || defaultIcon] || Icons[defaultIcon] || Icons.LayoutGrid;
        const isSelected = value === opt.id;
        const colorTheme = COLORS[(index + 1) % COLORS.length]; 
        
        return (
          <button
            key={opt.id}
            onClick={() => {
              onChange(opt.id);
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-4 py-2 transition-colors text-left cursor-pointer ${
              isSelected ? 'bg-primary-50 text-primary-900' : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className={`p-1 rounded-md shrink-0 ${isSelected ? 'bg-primary-600 text-white' : colorTheme.bg + ' ' + colorTheme.color}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <span className={`text-xs font-semibold ${isSelected ? 'text-primary-900' : 'text-slate-700'}`}>
              {opt.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
