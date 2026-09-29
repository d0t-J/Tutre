import { Library } from 'lucide-react';

export default function CurriculumHeader() {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-2">
        <div className="bg-slate-100 p-1.5 rounded-lg text-slate-600">
          <Library className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">Curriculum Management</h2>
          <p className="text-xs text-slate-500 font-medium">Manage the taxonomy of your simulations. Create and organize Classes, Subjects, and Chapters.</p>
        </div>
      </div>
    </div>
  );
}
