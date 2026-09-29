import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { checkAdminStatus, loginApi, logoutApi } from '../services/authApi';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let currentUserId = null;

    supabase.auth.getSession().then(({ data: { session } }) => {
      currentUserId = session?.user?.id;
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id, setIsAdmin, setLoading);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const isDifferentUser = session?.user?.id !== currentUserId;
      currentUserId = session?.user?.id;

      setUser(session?.user ?? null);
      if (session?.user) {
        if (event === 'SIGNED_IN' || isDifferentUser) {
          if (isDifferentUser) setLoading(true);
          checkAdminStatus(session.user.id, setIsAdmin, setLoading);
        }
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = (email, password) => loginApi(email, password);
  const logout = () => logoutApi();

  return (
    <AuthContext.Provider value={{ user, isAdmin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
