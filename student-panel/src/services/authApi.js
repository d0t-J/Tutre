import { supabase } from './supabase';

export const loginApi = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) return { error };

  // Before fully logging them in visually, let's explicitly verify they are not an admin
  if (data?.user) {
    try {
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();
      
      if (adminData) {
        await supabase.auth.signOut();
        return { error: new Error('Invalid login credentials') };
      }
    } catch {
      await supabase.auth.signOut();
      return { error: new Error('Unable to verify account type') };
    }
  }
  
  return { data, error };
};

export const signupApi = async (email, password, fullName) => {
  return supabase.auth.signUp({ 
    email, 
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  });
};

export const logoutApi = async () => {
  return supabase.auth.signOut();
};

export const enforceStudentOnlyApi = async (sessionUser, setUser, setLoading) => {
  if (!sessionUser) {
    setUser(null);
    setLoading(false);
    return;
  }

  try {
      const { data } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', sessionUser.id)
        .maybeSingle();
    
    if (data) {
      await supabase.auth.signOut();
      setUser(null);
    } else {
      setUser(sessionUser);
    }
  } catch {
    await supabase.auth.signOut();
    setUser(null);
  } finally {
    setLoading(false);
  }
};
