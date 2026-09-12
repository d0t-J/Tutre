import { MousePointerClick, BrainCircuit, Smartphone, BookOpenCheck } from 'lucide-react';

const FEATURES = [
  {
    icon: <MousePointerClick className="w-6 h-6 text-primary-600" />,
    title: '100% Interactive',
    description: 'Manipulate variables in real-time and immediately visualize complex theories in action.',
  },
  {
    icon: <BrainCircuit className="w-6 h-6 text-primary-600" />,
    title: 'AI-Powered Tutor',
    description: 'Learn directly alongside a smart assistant that guides you step-by-step through tough concepts.',
  },
  {
    icon: <BookOpenCheck className="w-6 h-6 text-primary-600" />,
    title: 'Curriculum Aligned',
    description: 'Master subjects across Physics, Chemistry, Math, and Biology with structured, rigorous content.',
  },
  {
    icon: <Smartphone className="w-6 h-6 text-primary-600" />,
    title: 'Cross-Platform',
    description: 'Flawless experience across massive desktop screens, tablets, and your mobile phone.',
  },
];

export default function Features() {
  return (
    <section className="relative z-20 py-20 lg:py-32 px-4 sm:px-8 lg:px-16 max-w-360 mx-auto w-full">
      <div className="text-center mb-16 lg:mb-24">
        <h3 className="text-[10px] sm:text-xs font-bold text-primary-600 tracking-[0.2em] uppercase mb-4">Core Benefits</h3>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-800 tracking-tight">Everything you need to <br className="hidden sm:block" />master STEM.</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {FEATURES.map((feature, idx) => (
          <div key={idx} className="group relative rounded-3xl p-px bg-slate-200/50 hover:bg-transparent transition-colors duration-500 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-primary-500/10">
            {/* Rotating Gradient Border Effect */}
            <div className="absolute -inset-full bg-[conic-gradient(from_0deg,transparent_0_300deg,#0ea5e9_360deg)] animate-[spin_4s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Soft Glow Underneath */}
            <div className="absolute inset-0 bg-primary-400/20 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-700" />

            <div className="relative h-full w-full bg-white rounded-3xl p-6 sm:p-8 flex flex-col items-start gap-5 z-10">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center border border-primary-100/50 group-hover:scale-110 group-hover:bg-primary-100 transition-all duration-300">
                {feature.icon}
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800 mb-2">{feature.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
