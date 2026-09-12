import { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase';
import { loginApi, signupApi, logoutApi, enforceStudentOnlyApi } from '../../../services/authApi';
import { GlobalSplashScreen } from '../../../components/common';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      enforceStudentOnlyApi(session?.user, setUser, setLoading);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      enforceStudentOnlyApi(session?.user, setUser, setLoading);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = (email, password) => loginApi(email, password);
  const signup = (email, password, fullName) => signupApi(email, password, fullName);
  const logout = () => logoutApi();

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {loading ? <GlobalSplashScreen /> : children}
    </AuthContext.Provider>
  );
};
