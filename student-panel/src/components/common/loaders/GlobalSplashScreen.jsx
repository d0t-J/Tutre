import Logo from '../../../assets/co_tutor_new_logo.png';
import DotField from '../DotField';

export default function GlobalSplashScreen() {
  return (
    <div className="h-screen w-screen relative flex flex-col items-center justify-center bg-slate-50 overflow-hidden">
      {/* Dotted Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <DotField dotRadius={1.5} dotSpacing={14} />
      </div>
      
      {/* Centered Pulsing Logo */}
      <div className="relative z-10">
        <img 
          src={Logo} 
          alt="Co-Tutor Logo" 
          className="w-[100px] sm:w-[132px] md:w-[164px] h-auto object-contain animate-pulse" 
        />
      </div>
    </div>
  );
}
