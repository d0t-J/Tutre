import { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from '../components/layout';
import ProtectedRoute from './ProtectedRoute';
import Auth from '../pages/Auth/Auth';
import Landing from '../pages/Landing/Landing';
import { PageSkeleton } from '../components/common';
import Dashboard from '../pages/Dashboard/Dashboard';

const SimulationViewer = lazy(() => import('../pages/Simulations/SimulationViewer'));

export default function AppRoutes() {
  const location = useLocation();
  const isStandalonePage = location.pathname === '/login' || location.pathname === '/';

  const routesContent = (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/class/:classSlug" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/class/:classSlug/subject/:subjectSlug" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/class/:classSlug/subject/:subjectSlug/chapter/:chapterSlug" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/class/:classSlug/subject/:subjectSlug/chapter/:chapterSlug/simulation/:id" element={
          <ProtectedRoute>
            <SimulationViewer />
          </ProtectedRoute>
        } />
        <Route path="/class/:classSlug/subject/:subjectSlug/simulation/:id" element={
          <ProtectedRoute>
            <SimulationViewer />
          </ProtectedRoute>
        } />
      </Routes>
    </Suspense>
  );

  // If it's a standalone page (auth or landing), don't use the sidebar Layout
  if (isStandalonePage) {
    const isLogin = location.pathname === '/login';
    return (
      <div className={`bg-slate-50 font-sans selection:bg-primary-100 ${isLogin ? 'h-dvh overflow-hidden' : 'min-h-dvh'}`}>
        {routesContent}
      </div>
    );
  }

  return (
    <Layout>
      {routesContent}
    </Layout>
  );
}
