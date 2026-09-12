import { supabase } from './supabase';
import { toast } from 'sonner';

export const checkAdminStatus = async (userId, setIsAdmin, setLoading) => {
  try {
    const { data } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (data) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
      await supabase.auth.signOut();
    }
  } catch (error) {
    console.error('Error checking admin status:', error);
    toast.error('Could not verify admin permissions. Please sign in again.');
    setIsAdmin(false);
    await supabase.auth.signOut();
  } finally {
    setLoading(false);
  }
};

export const loginApi = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) return { error };

  if (data?.user) {
    try {
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', data.user.id)
        .single();
      
      if (!adminData) {
        await supabase.auth.signOut();
        return { error: new Error('Invalid login credentials') };
      }
    } catch {
      await supabase.auth.signOut();
      return { error: new Error('Invalid login credentials') };
    }
  }
  
  return { data, error };
};

export const logoutApi = async () => {
  return supabase.auth.signOut();
};
