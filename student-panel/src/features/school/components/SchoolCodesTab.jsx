import { CreateInviteCodeForm, InviteCodeList } from './InviteCodes';
import { codeState } from '../utils/school';

export default function SchoolCodesTab({ data }) {
  const activeSections = data.sections.filter(s => !s.archived);
  const sectionNames = Object.fromEntries(data.sections.map(s => [s.id, s.name]));
  const active = data.codes.filter(c => codeState(c) === 'active');
  const past = data.codes.filter(c => codeState(c) !== 'active');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-1">Create a code</h3>
        <p className="text-xs text-slate-400 mb-3">
          A section code also puts the person in that section. Students and teachers enter codes on the Join page.
        </p>
        <CreateInviteCodeForm
          orgId={data.school.id}
          roles={['student', 'teacher', 'org_admin']}
          sections={activeSections}
        />
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-1">Active codes ({active.length})</h3>
        <InviteCodeList codes={active} sectionNames={sectionNames} canRevoke={() => true} emptyText="No active codes." />
      </div>

      {past.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-bold text-slate-500">Expired, used up and revoked ({past.length})</summary>
          <InviteCodeList codes={past} sectionNames={sectionNames} canRevoke={() => false} />
        </details>
      )}
    </div>
  );
}
