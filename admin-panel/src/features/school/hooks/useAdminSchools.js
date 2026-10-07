import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';
import { byName } from '../utils/school';

// The schools the signed-in user can manage on My school: their own as a
// school admin, or every active school for a Tutre platform admin (Tutre is an
// admin of every school, Phase 5b). Suspended schools are managed on Schools.
export const useAdminSchools = () => {
  const { user, isPlatformAdmin, adminOrgs } = useAuth();

  return useQuery({
    queryKey: ['admin-schools', user?.id, isPlatformAdmin, adminOrgs.map(o => o.id).join(',')],
    queryFn: async () => {
      if (!isPlatformAdmin) return [...adminOrgs].sort(byName);
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('status', 'active');
      if (error) throw new Error(error.message);
      return data.sort(byName);
    },
    enabled: !!user,
  });
};
