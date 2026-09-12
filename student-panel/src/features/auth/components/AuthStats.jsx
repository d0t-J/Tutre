export default function AuthStats({ loaded }) {
  return (
    <div className={`w-full flex flex-wrap justify-center items-center gap-2 sm:gap-4 pointer-events-auto transition-all duration-1000 delay-300 ${loaded ? 'animate-fade-in-up' : 'opacity-0 translate-y-6'}`}>
      {[
        { label: 'Simulations', value: '50+' },
        { label: 'Subjects', value: '4' },
        { label: 'Interactive', value: '100%' },
      ].map((stat, i) => (
        <div key={i} className="flex items-center gap-1.5 bg-white/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/50 shadow-sm">
          <span className="text-xs sm:text-sm font-bold text-primary-700">{stat.value}</span>
          <span className="text-[9px] sm:text-[10px] text-slate-600 font-bold uppercase tracking-wider">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
