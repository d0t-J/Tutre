import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles } from 'lucide-react';

// Which part of the staff portal a route belongs to (see deriveRoles in
// services/authApi.js). Route guards are for usability only: the database's
// RLS policies and functions decide what anyone can actually read or change.
//   studio     the Tutre content team
//   school     school admins and Tutre platform admins
//   classroom  teachers and school admins
//   signedIn   anyone signed in, staff or not (the Join page)
//   (none)     any staff member
const ALLOWED = {
  studio: (roles) => roles.isAdmin,
  school: (roles) => roles.isSchoolAdmin,
  classroom: (roles) => roles.canTeach,
  signedIn: () => true,
};

export default function ProtectedRoute({ children, fallback, area }) {
  const roles = useAuth();
  const location = useLocation();
  const { user, loading, isStaff } = roles;

  if (loading) {
    if (fallback) return fallback;
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-linear-to-br from-primary-100 to-primary-50 rounded-xl flex items-center justify-center shadow-sm border border-primary-100/50 animate-bounce">
            <Sparkles className="w-6 h-6 text-primary-600" />
          </div>
          <p className="text-sm font-medium text-slate-500 animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (area === 'signedIn') return children;
  // Signed in but not on any school's staff (yet): they can only join.
  if (!isStaff) return <Navigate to="/join" replace />;
  if (area && !ALLOWED[area](roles)) return <Navigate to="/" replace />;

  return children;
}
