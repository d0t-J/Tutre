import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../auth';

// Which school screens the signed-in user can open. A suspended school's row is
// not readable, so its memberships count towards hasSchool but grant nothing.
export const useMyRoles = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-roles', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_memberships')
        .select('org_id, role, organizations(id, name, status)')
        .eq('user_id', user.id)
        .eq('status', 'active');
      if (error) throw new Error(error.message);

      const active = data.filter(m => m.organizations?.status === 'active');
      return {
        adminOrgs: active.filter(m => m.role === 'org_admin').map(m => m.organizations),
        isTeacher: active.some(m => m.role === 'teacher'),
        hasSchool: data.length > 0,
        hasSuspendedSchool: data.some(m => m.organizations?.status !== 'active'),
      };
    },
    enabled: !!user,
  });
};

// Every school screen reads through these keys; refresh them all after a change.
export const invalidateSchoolQueries = (queryClient) => {
  for (const key of ['my-roles', 'my-school', 'teaching', 'school-admin']) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
};

// Phase 5g: a student does not join with a code directly; they ask, with
// their name and roll number as the school has them, and a teacher or the
// school's admin approves. The database refuses to let a student skip that.
export const useRequestToJoin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ code, fullName, rollNumber }) => {
      const { data, error } = await supabase.rpc('request_to_join', {
        p_code: code, p_full_name: fullName, p_roll_number: rollNumber,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      invalidateSchoolQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: ['my-join-requests'] });
    },
  });
};

// The student's own requests, newest first, with school and section names.
export const useMyJoinRequests = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-join-requests', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_join_requests');
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user,
    // A teacher may approve at any moment; check again when the page is seen.
    refetchOnWindowFocus: true,
  });
};

export const useCancelJoinRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.rpc('cancel_join_request', { p_request: id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-join-requests'] }),
  });
};

// What a code is for, without using it (Phase 5a): staff codes are redeemed in
// the staff portal, not here.
export const peekInviteCode = async (code) => {
  const { data, error } = await supabase.rpc('peek_invite_code', { p_code: code });
  if (error) throw new Error(error.message);
  return data;
};
