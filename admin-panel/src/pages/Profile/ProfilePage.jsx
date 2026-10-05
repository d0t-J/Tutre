import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../features/profile/hooks/useProfile';
import ProfileForm from '../../features/profile/components/ProfileForm';

export default function ProfilePage() {
  const { user, studioRole } = useAuth();
  const { data: profile, isLoading, error } = useProfile();

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto bg-white p-5 sm:p-6 rounded-none sm:rounded-2xl shadow-sm border-0 sm:border border-slate-100">
        <h2 className="text-lg font-extrabold text-slate-800 mb-4">Your profile</h2>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading...
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">Could not load your profile. Please refresh the page.</p>
        ) : !profile ? (
          <p className="text-sm text-red-600">Your profile could not be found. Please contact a platform admin.</p>
        ) : (
          <ProfileForm profile={profile} email={user?.email} studioRole={studioRole} />
        )}
      </div>
    </div>
  );
}
