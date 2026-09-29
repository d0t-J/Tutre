import * as Icons from 'lucide-react';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardHeader({
  breadcrumbs, searchQuery, setSearchQuery, showSearch = true
}) {
  const maxDepth = 3; // Class -> Subject -> Chapter
  const progressPercentage = breadcrumbs ? Math.min((breadcrumbs.length / maxDepth) * 100, 100) : 0;

  return (
    <div className="flex flex-col gap-5 mb-2 relative z-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Breadcrumbs Navigation & Progress */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <div className="flex items-center text-sm font-medium whitespace-nowrap overflow-x-auto custom-scrollbar pb-1">
            {breadcrumbs && breadcrumbs.length > 0 ? (
              breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <div key={crumb.path} className="flex items-center">
                    {index > 0 && <Icons.ChevronRight className="w-4 h-4 mx-2 text-slate-300 shrink-0" />}
                    {isLast ? (
                      <div className="flex items-center">
                        <span className="text-slate-800 font-bold">{crumb.label}</span>
                        {breadcrumbs.length < maxDepth && (
                          <Icons.ChevronRight className="w-4 h-4 ml-2 text-slate-300 shrink-0" />
                        )}
                      </div>
                    ) : (
                      <Link 
                        to={crumb.path}
                        className="text-slate-500 hover:text-primary-600 transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </div>
                );
              })
            ) : (
              <span className="text-slate-400 italic">Loading...</span>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-500 transition-all duration-500 ease-out" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="relative w-full md:w-72 lg:w-96 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
            />
          </div>
        )}
        
      </div>
    </div>
  );
}
