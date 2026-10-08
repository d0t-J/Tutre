import { supabase } from './supabase';

// The student app is for students (Phase 5a). The Tutre content team, and
// teachers and school admins who are not also students somewhere, use the staff
// portal instead. get_my_context() returns the user's own roles in one call.
let contextRequest = null;
const fetchMyContext = () => {
  // Sign-in and the session check ask at the same moment; share one request.
  if (!contextRequest) {
    contextRequest = supabase.rpc('get_my_context')
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      })
      .finally(() => { contextRequest = null; });
  }
  return contextRequest;
};

export const isStaffOnly = (context) => {
  if (context?.studio_role) return true;
  const active = (context?.memberships ?? []).filter(m => m.org_status === 'active');
  const isStaff = active.some(m => m.role === 'teacher' || m.role === 'org_admin');
  const isStudent = active.some(m => m.role === 'student');
  return isStaff && !isStudent;
};

// The session check below (enforceStudentOnlyApi) runs on every sign-in too and
// may sign a staff account out before loginApi has finished its own check;
// remembering whom it signed out lets loginApi still give the right message.
let staffSignedOutId = null;

const staffAccountError = () => Object.assign(new Error('This is a staff account.'), { code: 'staff_account' });

export const loginApi = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error };

  if (data?.user) {
    try {
      if (isStaffOnly(await fetchMyContext())) {
        await supabase.auth.signOut();
        return { error: staffAccountError() };
      }
    } catch {
      await supabase.auth.signOut();
      if (staffSignedOutId === data.user.id) return { error: staffAccountError() };
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
    if (isStaffOnly(await fetchMyContext())) {
      staffSignedOutId = sessionUser.id;
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
