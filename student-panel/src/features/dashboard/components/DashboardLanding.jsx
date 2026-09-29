import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { slugify } from '../../../utils/slugify';
import { DotField } from '../../../components/common';

export default function DashboardLanding({ classes, isLoading }) {
  const navigate = useNavigate();

  return (
    <div className="absolute inset-0 p-0 sm:p-4 lg:p-6 flex flex-col">
      <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-none sm:rounded-2xl shadow-sm border-0 sm:border border-slate-100 flex-1 flex flex-col items-center justify-center min-h-0 overflow-y-auto relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <DotField dotRadius={1.5} dotSpacing={14} />
        </div>
        <div className="text-center max-w-2xl lg:max-w-4xl animate-fade-in-up flex flex-col items-center relative z-10 mb-2 sm:mb-0">
          <div className="w-10 h-10 sm:w-16 sm:h-16 bg-linear-to-br from-primary-100 to-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-6 shadow-sm border border-primary-100/50">
            <Icons.GraduationCap className="w-5 h-5 sm:w-8 sm:h-8 text-primary-600" />
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2 sm:mb-4">Welcome to Co-Tutor</h2>
          <p className="[@media(max-height:650px)]:hidden text-sm sm:text-base text-slate-500 font-medium leading-relaxed mb-6 sm:mb-8 max-w-lg px-2 sm:px-0">
            Please select a class below or from the top menu to begin exploring interactive simulations.
          </p>
          
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-3 sm:gap-4 w-full max-w-[320px] sm:max-w-none mx-auto">
            {isLoading ? (
              // Skeleton Loaders
              [...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center gap-2 w-full sm:w-48 px-4 sm:px-6 py-4 sm:py-3 bg-white border-2 border-slate-100 rounded-2xl shadow-sm"
                >
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <Icons.GraduationCap className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="h-4 w-16 bg-slate-200 animate-pulse rounded-md" />
                </div>
              ))
            ) : (
              // Actual Buttons
              classes.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => navigate(`/class/${slugify(cls.name)}`)}
                  className="flex flex-col items-center justify-center gap-2 w-full sm:w-48 px-4 sm:px-6 py-4 sm:py-3 bg-white hover:bg-slate-50 border-2 border-slate-100 hover:border-primary-100 rounded-2xl shadow-sm hover:shadow-md text-base text-slate-700 font-bold transition-all cursor-pointer group"
                >
                  <div className="p-2.5 bg-slate-50 group-hover:bg-primary-50 rounded-xl transition-colors">
                    <Icons.GraduationCap className="w-6 h-6 text-slate-400 group-hover:text-primary-600 transition-colors" />
                  </div>
                  {cls.name}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
