import { Layers, BookOpen, Library } from 'lucide-react';

export default function CurriculumTabs({ activeTab, setActiveTab }) {
  return (
    <div className="border-b border-slate-100 shrink-0 mb-4">
      <div className="flex items-center gap-6">
        <TabButton 
          active={activeTab === 'classes'} 
          onClick={() => setActiveTab('classes')} 
          icon={<Layers className="w-4 h-4" />}
          label="Classes" 
        />
        <TabButton 
          active={activeTab === 'subjects'} 
          onClick={() => setActiveTab('subjects')} 
          icon={<BookOpen className="w-4 h-4" />}
          label="Subjects" 
        />
        <TabButton 
          active={activeTab === 'chapters'} 
          onClick={() => setActiveTab('chapters')} 
          icon={<Library className="w-4 h-4" />}
          label="Chapters" 
        />
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-all ${
        active 
          ? 'border-primary-500 text-primary-700' 
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
