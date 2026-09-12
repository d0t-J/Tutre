export default function SimulationLoaderOverlay({ Icon, loaderBgClass }) {
  return (
    <div className={`absolute inset-0 flex flex-col items-center justify-center z-20 w-full ${loaderBgClass}`}>
      <div className="relative mb-8 mt-4">
        {/* Outer rippling rings */}
        <div className="absolute inset-0 bg-primary-200 rounded-2xl animate-ping opacity-60"></div>
        <div className="absolute -inset-4 bg-primary-100 rounded-full animate-pulse blur-xl opacity-70"></div>
        
        {/* Center floating icon */}
        <div className="relative w-16 h-16 bg-white border border-primary-100 shadow-xl rounded-2xl flex items-center justify-center animate-bounce z-10">
          {Icon && <Icon className="w-8 h-8 text-primary-500" />}
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-slate-800 mb-1.5 mt-2">Initializing...</h3>
      <p className="text-sm font-medium text-slate-500 animate-pulse max-w-50 text-center">
        Preparing interactive environment
      </p>
    </div>
  );
}
