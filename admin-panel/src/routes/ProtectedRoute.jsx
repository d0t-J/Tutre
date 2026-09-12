import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles } from 'lucide-react';

export default function ProtectedRoute({ children, fallback }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    if (fallback) return fallback;
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-linear-to-br from-primary-100 to-primary-50 rounded-xl flex items-center justify-center shadow-sm border border-primary-100/50 animate-bounce">
            <Sparkles className="w-6 h-6 text-primary-600" />
          </div>
          <p className="text-sm font-medium text-slate-500 animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
