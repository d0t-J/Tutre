import { Routes, Route, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Header from '../components/layout/Header';
import ProtectedRoute from './ProtectedRoute';
import Login from '../pages/Auth/Login';
import { HomeScreenSkeleton, SavedSimulationsSkeleton, CurriculumSkeleton } from '../components/common/SkeletonLoaders';
import { Sparkles } from 'lucide-react';

const CreateSimulation = lazy(() => import('../pages/Simulations/CreateSimulation'));
const SavedSimulationsPage = lazy(() => import('../pages/Simulations/SavedSimulationsPage'));
const CurriculumManager = lazy(() => import('../pages/Curriculum/CurriculumManager'));

export default function AppRoutes() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-[#FDFBF7] text-slate-800 font-sans selection:bg-primary-100 lg:overflow-hidden">
      {!isLoginPage && <Header />}

      <main className={`w-full flex-1 ${!isLoginPage ? 'p-0 sm:p-4 lg:p-6 lg:overflow-hidden' : ''}`}>
        <Suspense fallback={
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-linear-to-br from-primary-100 to-primary-50 rounded-xl flex items-center justify-center shadow-sm border border-primary-100/50 animate-bounce">
                <Sparkles className="w-6 h-6 text-primary-600" />
              </div>
              <p className="text-sm font-medium text-slate-500 animate-pulse">Loading dashboard...</p>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute fallback={<HomeScreenSkeleton />}>
                <Suspense fallback={<HomeScreenSkeleton />}>
                  <CreateSimulation />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/saved" element={
              <ProtectedRoute fallback={<SavedSimulationsSkeleton />}>
                <Suspense fallback={<SavedSimulationsSkeleton />}>
                  <SavedSimulationsPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/curriculum" element={
              <ProtectedRoute fallback={<CurriculumSkeleton />}>
                <Suspense fallback={<CurriculumSkeleton />}>
                  <CurriculumManager />
                </Suspense>
              </ProtectedRoute>
            } />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
