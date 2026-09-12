import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth';

import { Navbar, HeroSection, Features, PreviewSection, Footer } from '../../features/landing';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen w-full bg-slate-50 relative flex flex-col font-sans selection:bg-primary-500/30 overflow-x-hidden">
      <Navbar />
      <HeroSection loaded={loaded} navigate={navigate} />
      <Features />
      <PreviewSection />
      <Footer />
    </div>
  );
}
