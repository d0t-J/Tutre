import ClassSelector from '../../features/simulations/components/ClassSelector';
import SubjectSelector from '../../features/simulations/components/SubjectSelector';
import ChapterSelector from '../../features/simulations/components/ChapterSelector';
import TopicInput from '../../features/simulations/components/TopicInput';
import LivePreview from '../../features/simulations/components/LivePreview';
import { useWizard } from '../../features/simulations/context/WizardContext';
import SimulationWizard from '../../features/simulations/components/Wizard/SimulationWizard';

export default function CreateSimulation() {
  const { viewMode } = useWizard();

  if (viewMode === 'wizard') {
    return <SimulationWizard />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 lg:h-full p-2 sm:p-0">
      {/* Left Column: Controls */}
      <div className="lg:col-span-3 grid grid-cols-2 lg:flex lg:flex-col gap-2 sm:gap-3 lg:overflow-y-auto lg:pr-1">
        <ClassSelector />
        <SubjectSelector />
        <div className="col-span-2 lg:col-span-1">
          <ChapterSelector />
        </div>
        <div className="col-span-2 lg:col-span-1 flex-1 flex flex-col min-h-0">
          <TopicInput />
        </div>
      </div>

      {/* Right Column: Preview Area */}
      <div className="lg:col-span-7 relative min-h-150 lg:min-h-0 flex flex-col">
        <div className="lg:absolute lg:inset-0 flex flex-col flex-1">
          <LivePreview />
        </div>
      </div>
    </div>
  );
}
