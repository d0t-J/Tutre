import { ArrowRight, BookOpen } from 'lucide-react';
import { DotField } from '../../../components/common';
import { planetaryMotion } from '../../simulations/utils/planetaryMotion';

export default function HeroSection({ loaded, navigate }) {
  return (
    <main className="relative min-h-dvh flex items-center justify-center pt-20 lg:pt-20 px-4 sm:px-6">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        {/* Subtle Gradient Blobs */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-72 sm:w-125 h-72 sm:h-125 bg-primary-200/20 rounded-full filter blur-[80px] opacity-70 transform-gpu"></div>
          <div className="absolute -top-24 -right-24 w-72 sm:w-125 h-72 sm:h-125 bg-cyan-200/20 rounded-full filter blur-[80px] opacity-70 transform-gpu"></div>
          <div className="absolute -bottom-75 left-1/4 w-72 sm:w-200 h-72 sm:h-200 bg-teal-200/20 rounded-full filter blur-[120px] opacity-50 transform-gpu"></div>
        </div>

        <DotField dotRadius={1.5} dotSpacing={14} />
      </div>

      <div className="absolute inset-0 z-0 pointer-events-none mix-blend-multiply opacity-20 md:opacity-30 lg:opacity-50 transition-transform duration-1000 scale-[0.8] md:scale-90 lg:scale-100 origin-center">
        <iframe
          title="Planetary Motion Background"
          srcDoc={planetaryMotion.srcDoc}
          className="w-full h-full border-none bg-transparent"
          sandbox="allow-scripts"
          loading="lazy"
          allowtransparency="true"
        />
      </div>

      <div className={`relative z-10 text-center max-w-3xl mx-auto transition-all duration-1000 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-primary-100 shadow-sm text-primary-700 text-xs font-bold mb-6 mx-auto uppercase tracking-widest">
          <BookOpen className="w-4 h-4" />
          Interactive STEM Learning
        </div>
        
        <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-slate-800 tracking-tight leading-[1.05] mb-6">
          Experience Science & Math <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-600 to-cyan-500 pb-2">like never before.</span>
        </h2>
        
        <p className="text-base sm:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Manipulate variables in real-time, visualize complex theories, and learn directly alongside an AI-powered tutor built for curious minds.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-4 bg-linear-to-r from-primary-600 to-primary-700 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-base w-full sm:w-auto group cursor-pointer"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        {/* Stats */}
        <div className="mt-16 flex flex-wrap justify-center gap-6 sm:gap-12 opacity-80 border-t border-slate-200/60 pt-10">
          {[
            { label: 'Simulations', value: '50+' },
            { label: 'Subjects', value: '4' },
            { label: 'Interactive', value: '100%' },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">{stat.value}</span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
