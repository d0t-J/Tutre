import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';
import { requireRows } from '../utils/school';

// Writes used by the teacher and school admin screens. The database decides who
// may do what (RLS policies and the school functions); these hooks only call it
// and refresh the school queries afterwards.

// Every school screen reads through these keys; refresh them all after a change.
export const invalidateSchoolQueries = (queryClient) => {
  for (const key of ['teaching', 'school-admin', 'admin-schools']) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
};

// A change can alter the signed-in user's own roles (handing over the head
// role, joining a school), so the user's context is reloaded as well.
const useSchoolMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  const { refreshContext } = useAuth();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      invalidateSchoolQueries(queryClient);
      refreshContext();
    },
  });
};

export const useCreateInviteCode = () =>
  useSchoolMutation(async ({ orgId, role, sectionId = null, maxUses, validDays }) => {
    const { data, error } = await supabase.rpc('create_invite_code', {
      p_org: orgId,
      p_role: role,
      p_section: sectionId,
      p_max_uses: maxUses,
      p_valid_days: validDays,
    });
    if (error) throw new Error(error.message);
    return data;
  });

export const useRevokeInviteCode = () =>
  useSchoolMutation(async (codeId) => {
    const { error } = await supabase.rpc('revoke_invite_code', { p_id: codeId });
    if (error) throw new Error(error.message);
  });

export const useRemoveSectionMember = () =>
  useSchoolMutation(async ({ sectionId, userId, role }) => {
    const { data, error } = await supabase
      .from('section_members')
      .delete()
      .eq('section_id', sectionId)
      .eq('user_id', userId)
      .eq('role', role)
      .select('user_id');
    if (error) throw new Error(error.message);
    requireRows(data);
  });

export const useAddSectionMember = () =>
  useSchoolMutation(async ({ sectionId, userId, role }) => {
    const { error } = await supabase
      .from('section_members')
      .insert({ section_id: sectionId, user_id: userId, role });
    if (error) throw new Error(error.message);
  });

export const useRenameSchool = () =>
  useSchoolMutation(async ({ orgId, name }) => {
    const { data, error } = await supabase
      .from('organizations')
      .update({ name })
      .eq('id', orgId)
      .select('id');
    if (error) throw new Error(error.message);
    requireRows(data);
  });

export const useSetMembershipStatus = () =>
  useSchoolMutation(async ({ membershipId, status }) => {
    const { data, error } = await supabase
      .from('org_memberships')
      .update({ status })
      .eq('id', membershipId)
      .select('id');
    if (error) throw new Error(error.message);
    requireRows(data);
  });

export const useCreateSection = () =>
  useSchoolMutation(async ({ orgId, name, classId, academicYear }) => {
    const { error } = await supabase
      .from('sections')
      .insert({ org_id: orgId, name, class_id: classId || null, academic_year: academicYear || null });
    if (error) throw new Error(error.message);
  });

export const useUpdateSection = () =>
  useSchoolMutation(async ({ sectionId, changes }) => {
    const { data, error } = await supabase
      .from('sections')
      .update(changes)
      .eq('id', sectionId)
      .select('id');
    if (error) throw new Error(error.message);
    requireRows(data);
  });

// Makes a teacher of the school an admin as well (Phase 5b).
export const useMakeOrgAdmin = () =>
  useSchoolMutation(async ({ orgId, userId }) => {
    const { data, error } = await supabase.rpc('make_org_admin', { p_org: orgId, p_user: userId });
    if (error) throw new Error(error.message);
    return data;
  });

// Hands the head role to another admin. Only the head or Tutre may.
export const useTransferHead = () =>
  useSchoolMutation(async ({ orgId, userId }) => {
    const { error } = await supabase.rpc('transfer_head_admin', { p_org: orgId, p_user: userId });
    if (error) throw new Error(error.message);
  });

// Joining with a code. peek shows what a code is for without using it.
export const peekInviteCode = async (code) => {
  const { data, error } = await supabase.rpc('peek_invite_code', { p_code: code });
  if (error) throw new Error(error.message);
  return data;
};

export const useRedeemCode = () =>
  useSchoolMutation(async (code) => {
    const { data, error } = await supabase.rpc('redeem_invite_code', { p_code: code });
    if (error) throw new Error(error.message);
    return data;
  });
