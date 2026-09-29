import ViewerHeaderSkeleton from './ViewerHeaderSkeleton';
import GuidePanelSkeleton from './GuidePanelSkeleton';
import ViewerIframeSkeleton from './ViewerIframeSkeleton';
import ChatbotSkeleton from './ChatbotSkeleton';
import SimulationTabsSkeleton from './SimulationTabsSkeleton';

export default function SimulationViewerSkeleton() {
  return (
    <div className="h-full flex flex-col bg-[#FDFBF7]">
      <ViewerHeaderSkeleton />
      <main className="flex-1 relative flex flex-col xl:flex-row xl:items-center xl:justify-center overflow-y-auto xl:overflow-hidden px-4 pb-4 pt-0 gap-4">
        <GuidePanelSkeleton />
        <ViewerIframeSkeleton />
        <ChatbotSkeleton />
        <SimulationTabsSkeleton />
      </main>
    </div>
  );
}
