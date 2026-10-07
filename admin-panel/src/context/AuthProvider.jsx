import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../services/supabase';
import { deriveRoles, fetchMyContext, loginApi, logoutApi, signupApi } from '../services/authApi';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef(null);

  // Loads the user's roles. If that fails the session is ended, as before:
  // the portal never guesses at someone's access.
  const loadContext = useCallback(async (userId) => {
    try {
      const data = await fetchMyContext();
      if (userIdRef.current === userId) setContext(data);
    } catch (error) {
      console.error('Error loading the user context:', error);
      toast.error('Could not check your access. Please sign in again.');
      setContext(null);
      await supabase.auth.signOut();
    } finally {
      if (userIdRef.current === userId) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // The first event (INITIAL_SESSION) carries the stored session, if any.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const nextId = session?.user?.id ?? null;
      const isDifferentUser = nextId !== userIdRef.current;
      userIdRef.current = nextId;
      setUser(session?.user ?? null);

      if (!session?.user) {
        setContext(null);
        setLoading(false);
      } else if (isDifferentUser) {
        setContext(null);
        setLoading(true);
        // Supabase advises not to await other Supabase calls inside this callback.
        setTimeout(() => loadContext(nextId), 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadContext]);

  const refreshContext = useCallback(() => {
    if (userIdRef.current) return loadContext(userIdRef.current);
    return Promise.resolve();
  }, [loadContext]);

  const value = useMemo(() => ({
    user,
    loading,
    ...deriveRoles(context),
    refreshContext,
    login: loginApi,
    signup: signupApi,
    logout: logoutApi,
  }), [user, loading, context, refreshContext]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
