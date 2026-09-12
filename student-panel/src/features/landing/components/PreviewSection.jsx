import { CheckCircle2 } from 'lucide-react';
import { ResponsiveSimulationFrame } from '../../../components/common';
import { FEATURED_ANIMATIONS } from '../../simulations/utils/animations';

export default function PreviewSection() {
  const previewAnim = FEATURED_ANIMATIONS[0]; // Solar System

  return (
    <section className="relative w-full py-24 sm:py-32">
      {/* Mesh Gradient Background - Optimized for Performance */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-150 h-150 bg-primary-200/30 rounded-full filter blur-[100px] transform-gpu" />
        <div className="absolute top-1/2 left-0 w-125 h-125 bg-cyan-200/30 rounded-full filter blur-[100px] transform-gpu" />
        <div className="absolute bottom-0 right-1/4 w-100 h-100 bg-blue-200/30 rounded-full filter blur-[100px] transform-gpu" />
      </div>

      <div className="max-w-360 mx-auto px-4 sm:px-8 lg:px-16 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          {/* Text Content */}
          <div className="flex flex-col items-start w-full lg:w-1/2 lg:pr-8">
            <h3 className="text-[10px] sm:text-xs font-bold text-primary-600 tracking-[0.2em] uppercase mb-4">Inside the Portal</h3>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-800 tracking-tight leading-tight mb-6">
              Learn by doing, <br className="hidden sm:block" />not just watching.
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mb-8 leading-relaxed max-w-lg">
              Our interactive modules put you in the driver's seat. Manipulate variables, observe molecular structures, and watch complex STEM concepts come to life instantly in real-time.
            </p>

            <ul className="space-y-4 mb-10">
              {[
                'Interactive visual simulations',
                'Real-time variable manipulation',
                'Side-by-side AI assistance',
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-slate-700 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-primary-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

          </div>

          {/* Preview Window (Glassmorphic Mockup) */}
          <div className="relative w-full lg:w-1/2 rounded-3xl p-2 sm:p-4 bg-white/40 backdrop-blur-3xl border border-white/60 shadow-[0_8px_40px_rgb(0,0,0,0.08)]">
            <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-900 relative shadow-inner">
              
              {/* Window Controls (Mac style) */}
              <div className="absolute top-0 left-0 right-0 h-10 bg-slate-800/80 backdrop-blur-md flex items-center px-4 gap-2 z-20">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <div className="ml-4 text-xs font-medium text-slate-400 tracking-wider">Chemistry / {previewAnim?.title || 'Simulation'}</div>
              </div>

              {/* Simulation Iframe */}
              {previewAnim && (
                <div className="w-full relative" style={{ minHeight: '300px' }}>
                  <ResponsiveSimulationFrame 
                    srcDoc={previewAnim.srcDoc}
                    title={previewAnim.title}
                    padding={0} // No gray padding inside the mockup
                    containerClassName="w-full h-full min-h-[300px] flex items-center justify-center overflow-hidden pt-10"
                    wrapperClassName="relative flex items-center justify-center shrink-0"
                  />
                </div>
              )}
            </div>
            
            {/* Decorative elements - Optimized */}
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary-500 rounded-full filter blur-xl opacity-30 transform-gpu" />
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-cyan-400 rounded-full filter blur-xl opacity-30 transform-gpu" />
          </div>

        </div>
      </div>
    </section>
  );
}
