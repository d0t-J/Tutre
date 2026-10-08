import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';

// Phase 5g: students ask to join (join_requests) and the section's teachers or
// the school's admins decide; class lists and slip codes help match them; and
// teachers can give a student a one-time password reset code. The database
// enforces who may do what (migration 20261012090000); these hooks only call it.

const byRoll = (a, b) => a.roll_number.localeCompare(b.roll_number, undefined, { numeric: true, sensitivity: 'base' });

const rpc = async (name, args) => {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(error.message);
  return data;
};

export const useSectionJoinRequests = (sectionId) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['join-requests', sectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('join_requests')
        .select('id, full_name, roll_number, created_at, from_slip, class_list_entry_id, class_list_entries(full_name, roll_number)')
        .eq('section_id', sectionId)
        .eq('status', 'pending')
        .order('created_at');
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user && !!sectionId,
    // Students ask during class: keep the list fresh while the page is open.
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
  });
};

const useStudentMutation = (mutationFn, keys) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      for (const key of keys) queryClient.invalidateQueries({ queryKey: [key] });
    },
  });
};

export const useDecideJoinRequests = () =>
  useStudentMutation(
    ({ ids, approve, reason = null }) => rpc('decide_join_requests', { p_requests: ids, p_approve: approve, p_reason: reason }),
    ['join-requests', 'class-list', 'teaching', 'school-admin'],
  );

export const useClassList = (sectionId) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['class-list', sectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_list_entries')
        .select('id, full_name, roll_number, student_id, created_at')
        .eq('section_id', sectionId);
      if (error) throw new Error(error.message);
      return data.sort(byRoll);
    },
    enabled: !!user && !!sectionId,
  });
};

// entries: [{ fullName, rollNumber }]
export const useAddClassListEntries = () =>
  useStudentMutation(async ({ sectionId, entries }) => {
    const { error } = await supabase.from('class_list_entries').insert(
      entries.map(e => ({ section_id: sectionId, full_name: e.fullName, roll_number: e.rollNumber })),
    );
    if (error) throw new Error(error.message);
  }, ['class-list']);

export const useRemoveClassListEntry = () =>
  useStudentMutation(async (id) => {
    const { data, error } = await supabase.from('class_list_entries').delete().eq('id', id).select('id');
    if (error) throw new Error(error.message);
    if (!data?.length) throw new Error("You don't have permission to do that.");
  }, ['class-list']);

export const fetchSlipCode = (entryId, replace = false) => rpc('slip_code', { p_entry: entryId, p_replace: replace });

export const createPasswordResetCode = (userId) => rpc('create_password_reset_code', { p_user: userId });

export const supportPasswordResetCode = (email) => rpc('support_password_reset_code', { p_email: email });

export const setSchoolVerification = ({ orgId, verified, emisCode }) =>
  rpc('set_school_verification', { p_org: orgId, p_verified: verified, p_emis_code: emisCode || null });

// Parses pasted lines such as "12, Ali Khan" or "12<TAB>Ali Khan" (roll number
// first, as in a register). Lines that do not fit are returned as rejected.
export const parseClassList = (text) => {
  const entries = [];
  const rejected = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const match = line.match(/^([^,\t;]{1,30})[,\t;]\s*(.{2,120})$/);
    if (match) entries.push({ rollNumber: match[1].trim(), fullName: match[2].trim() });
    else rejected.push(line);
  }
  return { entries, rejected };
};
