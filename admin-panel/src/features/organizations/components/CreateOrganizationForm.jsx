import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import { useCreateOrganization } from '../hooks/useOrganizations';
import { SLUG_PATTERN, formatDate, slugFromName } from '../utils/codes';
import CodeBadge from './CodeBadge';

const inputClass =
  'w-full text-sm p-2.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-100 outline-none transition-colors';
const labelClass = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5';

export default function CreateOrganizationForm() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [created, setCreated] = useState(null);
  const createOrganization = useCreateOrganization();

  const effectiveSlug = slugEdited ? slug : slugFromName(name);
  const error =
    name.trim().length > 0 && name.trim().length < 2 ? 'Use at least 2 characters for the name.'
    : effectiveSlug && !SLUG_PATTERN.test(effectiveSlug) ? 'Use lower-case letters, digits and single hyphens in the short name.'
    : null;
  const canSubmit = name.trim().length >= 2 && SLUG_PATTERN.test(effectiveSlug) && !createOrganization.isPending;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    createOrganization.mutate(
      { name: name.trim(), slug: effectiveSlug },
      {
        onSuccess: (data) => {
          setCreated(data);
          setName('');
          setSlug('');
          setSlugEdited(false);
          toast.success(`${data.name} created.`);
        },
        onError: (err) =>
          toast.error(err.message?.includes('duplicate') ? 'That short name is already taken.' : err.message || 'Could not create the school.'),
      }
    );
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-56">
            <label htmlFor="org-name" className={labelClass}>School name</label>
            <input id="org-name" type="text" maxLength={120} placeholder="Government High School, Faisalabad"
              value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div className="w-64">
            <label htmlFor="org-slug" className={labelClass}>Short name</label>
            <input id="org-slug" type="text" maxLength={60} placeholder="ghs-faisalabad"
              value={effectiveSlug}
              onChange={(e) => { setSlug(e.target.value.toLowerCase()); setSlugEdited(true); }}
              className={`${inputClass} font-mono`} />
          </div>
          <button type="submit" disabled={!canSubmit}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {createOrganization.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create school
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </form>

      {created && (
        <div className="space-y-1.5">
          <p className="text-sm text-slate-700">
            Give this code to the principal of <strong>{created.name}</strong>. They sign up in the student app, open
            Join, and enter it to become the school admin.
          </p>
          <CodeBadge code={created.admin_code} note={`School admin code · 1 use · expires ${formatDate(created.admin_code_expires_at)}`} />
        </div>
      )}
    </div>
  );
}
