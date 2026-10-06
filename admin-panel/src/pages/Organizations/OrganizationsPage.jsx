import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrganizations } from '../../features/organizations/hooks/useOrganizations';
import CreateOrganizationForm from '../../features/organizations/components/CreateOrganizationForm';
import OrganizationCard from '../../features/organizations/components/OrganizationCard';

export default function OrganizationsPage() {
  const { studioRole } = useAuth();
  const { data: organizations, isLoading, error } = useOrganizations();

  if (studioRole !== 'platform_admin') {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto bg-white p-5 sm:p-6 rounded-none sm:rounded-2xl shadow-sm border-0 sm:border border-slate-100">
          <p className="text-sm text-slate-500">Only platform admins manage schools.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-4">
        <section className="bg-white p-5 sm:p-6 rounded-none sm:rounded-2xl shadow-sm border-0 sm:border border-slate-100">
          <h2 className="text-lg font-extrabold text-slate-800 mb-1">Schools</h2>
          <p className="text-sm text-slate-500 mb-4">
            Create a school to get its first school admin code. The school admin then manages teachers, students,
            sections and codes from the student app.
          </p>
          <CreateOrganizationForm />
        </section>

        <section className="bg-white p-5 sm:p-6 rounded-none sm:rounded-2xl shadow-sm border-0 sm:border border-slate-100">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : error ? (
            <p className="text-sm text-red-600">Could not load the schools. Please refresh the page.</p>
          ) : organizations.length === 0 ? (
            <p className="text-sm text-slate-500">No schools yet.</p>
          ) : (
            <ul className="space-y-3">
              {organizations.map(org => <OrganizationCard key={org.id} org={org} />)}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
