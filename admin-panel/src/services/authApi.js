import { supabase } from './supabase';

// Everything the portal needs to know about the signed-in user in one call:
// Studio role (author, reviewer or platform_admin, or null), active school
// memberships and sections. See get_my_context() in
// supabase/migrations/20261009090000_head_admins_staff_portal.sql.
export const fetchMyContext = async () => {
  const { data, error } = await supabase.rpc('get_my_context');
  if (error) throw new Error(error.message);
  return data;
};

// Who gets which part of the staff portal.
//  * Studio: members of the Tutre content team (admin_users).
//  * School: school admins (principals) of an active school, and Tutre
//    platform admins, who are admins of every school.
//  * Classroom: teachers and school admins of an active school.
// Anyone else who signs in (a new teacher, or a student) only gets the Join page.
export const deriveRoles = (context) => {
  const memberships = context?.memberships ?? [];
  const active = memberships.filter(m => m.org_status === 'active');
  const studioRole = context?.studio_role ?? null;
  const adminOrgs = active
    .filter(m => m.role === 'org_admin')
    .map(m => ({ id: m.org_id, name: m.org_name, isHead: m.is_head, verified: m.org_verified !== false }));
  // Schools where the user may create teaching material (Phase 5c).
  const staffOrgs = [...new Map(active
    .filter(m => m.role === 'teacher' || m.role === 'org_admin')
    .map(m => [m.org_id, { id: m.org_id, name: m.org_name }])).values()];
  const isPlatformAdmin = studioRole === 'platform_admin';
  const isTeacher = active.some(m => m.role === 'teacher');

  return {
    studioRole,
    isAdmin: !!studioRole,
    isPlatformAdmin,
    adminOrgs,
    isTeacher,
    isSchoolAdmin: isPlatformAdmin || adminOrgs.length > 0,
    canTeach: isTeacher || adminOrgs.length > 0,
    isStaff: !!studioRole || isTeacher || adminOrgs.length > 0,
    hasSuspendedSchool: memberships.some(m => m.org_status !== 'active' && m.role !== 'student'),
    staffOrgs,
    sections: context?.sections ?? [],
  };
};

export const loginApi = (email, password) => supabase.auth.signInWithPassword({ email, password });

// Staff accounts are ordinary accounts; joining a school with a staff code is
// what gives access. If email confirmation is on, there is no session until
// the address is confirmed.
export const signupApi = (email, password, fullName) =>
  supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${window.location.origin}/login`,
    },
  });

export const logoutApi = () => supabase.auth.signOut();
