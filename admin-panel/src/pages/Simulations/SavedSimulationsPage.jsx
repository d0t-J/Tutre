import SavedSimulations from '../../features/simulations/components/SavedSimulations';
import { useSimulation } from '../../features/simulations/context/SimulationContext';

export default function SavedSimulationsPage() {
  const { loadSavedSimulation, deleteSimulation } = useSimulation();
  
  return (
    <div className="h-full overflow-y-auto">
      <SavedSimulations 
        loadSavedSimulation={loadSavedSimulation} 
        deleteSimulation={deleteSimulation}
      />
    </div>
  );
}
