import * as Icons from 'lucide-react';
import { SimulationCard } from '../../../features/simulations';
import { EmptyState } from '../../../components/common';
import { slugify } from '../../../utils/slugify';
import { FALLBACK_MAP } from '../hooks/useSubjectIcon';

export default function DashboardGrid({ status, subjectIcon, simulations, isFetchingNextPage, lastElementRef }) {
  if (status === 'pending' || !subjectIcon) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        {subjectIcon && (() => {
          const LoaderIcon = Icons[subjectIcon] || Icons.Database;
          return <LoaderIcon className="w-16 h-16 text-primary-600 animate-scale-pulse" />;
        })()}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-red-200 text-red-500 font-medium text-lg">
        Error loading simulations. Please try again.
      </div>
    );
  }

  if (simulations.length === 0) {
    return (
      <EmptyState 
        message="We couldn't find any simulations matching your criteria. Try selecting a different class or clearing your search." 
      />
    );
  }

  return (
    <div className="flex-1">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 content-start">
        {simulations.map((sim, index) => {
          const subjectSlug = slugify(sim.subject);
          const iconName = FALLBACK_MAP[subjectSlug] || sim.icon_name || 'Book';
          const Icon = Icons[iconName] || Icons.Book;
          const isLastElement = index === simulations.length - 1;
          return (
            <div key={sim.sim_id} ref={isLastElement ? lastElementRef : null} className="h-full">
              <SimulationCard sim={sim} icon={Icon} color="text-primary-600" bg="bg-primary-50" />
            </div>
          );
        })}
      </div>
      
      {/* Lazy Load Spinner */}
      {isFetchingNextPage && (
        <div className="w-full flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}
    </div>
  );
}
