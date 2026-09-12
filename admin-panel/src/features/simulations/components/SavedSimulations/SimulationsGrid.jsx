import { useState } from 'react';
import { SimulationCardSkeleton } from '../../../../components/common/SkeletonLoaders';
import ConfirmationModal from '../../../../components/common/ConfirmationModal';
import EmptyState from '../../../../components/common/EmptyState';
import SimulationGridCard from './SimulationGridCard';

const COLORS = [
  { color: 'text-blue-600', bg: 'bg-blue-50' },
  { color: 'text-orange-600', bg: 'bg-orange-50' },
  { color: 'text-green-600', bg: 'bg-green-50' },
  { color: 'text-purple-600', bg: 'bg-purple-50' },
  { color: 'text-red-600', bg: 'bg-red-50' },
];

export default function SimulationsGrid({
  isLoading,
  isError,
  savedSimulations,
  loadSavedSimulation,
  deleteSimulation
}) {
  const [simToDelete, setSimToDelete] = useState(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 content-start">
        {Array.from({ length: 10 }).map((_, index) => (
          <SimulationCardSkeleton key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 bg-red-50 rounded-xl border-2 border-dashed border-red-200 text-red-500 font-medium">
        Error loading simulations.
      </div>
    );
  }

  if (savedSimulations.length === 0) {
    return (
      <EmptyState 
        message="You haven't created any simulations yet, or none match your current search."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 content-start">
      {savedSimulations.map((sim, index) => (
        <SimulationGridCard
          key={sim.sim_id || sim.id}
          sim={sim}
          theme={COLORS[index % COLORS.length]}
          onSelect={loadSavedSimulation}
          onDelete={setSimToDelete}
        />
      ))}

      <ConfirmationModal
        isOpen={!!simToDelete}
        onClose={() => setSimToDelete(null)}
        onConfirm={async () => {
          const sim = simToDelete;
          setSimToDelete(null);
          if (sim) await deleteSimulation(sim);
        }}
        title="Delete Simulation"
        message={`Are you sure you want to delete "${simToDelete?.topic}"? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
}
