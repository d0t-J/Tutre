import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// "/" is the Studio's Create page for the content team, as before. Everyone
// else starts on their own part of the portal.
export default function HomeRoute({ children }) {
  const { isAdmin, isSchoolAdmin, canTeach } = useAuth();
  if (isAdmin) return children;
  if (isSchoolAdmin) return <Navigate to="/school" replace />;
  if (canTeach) return <Navigate to="/classroom" replace />;
  return <Navigate to="/join" replace />;
}
