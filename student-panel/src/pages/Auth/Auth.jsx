import AuthForm from '../../features/auth/components/AuthForm';
import { Navbar } from '../../features/landing';
import { DotField } from '../../components/common';

export default function Auth() {
  return (
    <div className="h-full w-full bg-slate-50 relative flex flex-col overflow-hidden">
      {/* Subtle Background Blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-72 sm:w-100 h-72 sm:h-100 bg-primary-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -top-24 -right-24 w-72 sm:w-100 h-72 sm:h-100 bg-cyan-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-24 left-1/4 w-72 sm:w-100 h-72 sm:h-100 bg-blue-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        
        {/* Dotted Theme */}
        <DotField dotRadius={1.5} dotSpacing={14} />
      </div>

      {/* Shared Navbar */}
      <Navbar />

      {/* Form Content — vertically centered */}
      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center pb-10 sm:pb-16">
        <AuthForm />
      </div>
    </div>
  );
}
