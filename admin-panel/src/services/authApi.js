import { supabase } from './supabase';
import { toast } from 'sonner';

// studio_role is the Content Studio role: author, reviewer or platform_admin.
export const checkAdminStatus = async (userId, setIsAdmin, setLoading, setStudioRole = () => {}) => {
  try {
    const { data } = await supabase
      .from('admin_users')
      .select('id, studio_role')
      .eq('id', userId)
      .single();
    
    if (data) {
      setIsAdmin(true);
      setStudioRole(data.studio_role);
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
