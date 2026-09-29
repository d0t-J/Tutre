import { Loader2 } from 'lucide-react';

export function GeneratingState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-linear-to-br from-[#F1F5F9] to-white">
      <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-6 relative z-10" />
      <h3 className="text-lg sm:text-2xl font-bold text-slate-800 mb-2 relative z-10">
        Generating Magic...
      </h3>
      <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-sm relative z-10">
        The AI is currently building the interactive simulation. This usually takes about 10-15 seconds.
      </p>
    </div>
  );
}
