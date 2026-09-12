import { DropdownSkeleton } from './DropdownSkeleton';
import { TopicInputSkeleton } from './TopicInputSkeleton';
import { LivePreviewSkeleton } from './LivePreviewSkeleton';

export function HomeScreenSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 lg:h-full p-2 sm:p-0">
      <div className="lg:col-span-3 grid grid-cols-2 lg:flex lg:flex-col gap-2 sm:gap-3 lg:overflow-y-auto lg:pr-1">
        <DropdownSkeleton number="1" label="Choose Class" />
        <DropdownSkeleton number="2" label="Choose Subject" />
        <div className="col-span-2 lg:col-span-1 flex-1 flex flex-col min-h-0">
          <TopicInputSkeleton />
        </div>
      </div>
      <div className="lg:col-span-7 relative min-h-150 lg:min-h-0 flex flex-col">
        <div className="lg:absolute lg:inset-0 flex flex-col flex-1">
          <LivePreviewSkeleton />
        </div>
      </div>
    </div>
  );
}
