import { PlayCircle, Sparkles, Wand2 } from 'lucide-react';

export function ReadyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-linear-to-br from-[#F1F5F9] to-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

      {/* Animated Icons Container */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary-100 rounded-full blur-xl opacity-40 animate-pulse"></div>
        <div className="relative bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center justify-center transition-transform hover:scale-105 duration-500">
          <PlayCircle className="w-10 h-10 sm:w-16 sm:h-16 text-primary-500 opacity-80" />
        </div>
        <Sparkles className="absolute -top-3 -right-3 w-5 h-5 text-primary-400 animate-pulse opacity-70" />
        <Wand2 className="absolute -bottom-2 -left-3 w-5 h-5 text-primary-400 animate-pulse opacity-70" style={{ animationDelay: '1s' }} />
      </div>

      <h3 className="text-lg sm:text-2xl font-bold text-slate-800 mb-2 relative z-10">
        Ready to Create Magic?
      </h3>
      <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-sm relative z-10">
        Fill out the topic details on the left, add an optional image, and click "Generate Simulation" to bring your ideas to life!
      </p>
    </div>
  );
}
