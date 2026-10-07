import { useTranslation } from 'react-i18next';
import { CreateInviteCodeForm, InviteCodeList } from './InviteCodes';
import { codeState } from '../utils/school';

export default function SchoolCodesTab({ data }) {
  const { t } = useTranslation('school');
  const activeSections = data.sections.filter(s => !s.archived);
  const sectionNames = Object.fromEntries(data.sections.map(s => [s.id, s.name]));
  const active = data.codes.filter(c => codeState(c) === 'active');
  const past = data.codes.filter(c => codeState(c) !== 'active');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-1">{t('codes.createTitle')}</h3>
        <p className="text-xs text-slate-400 mb-3">{t('codes.createNote')}</p>
        <CreateInviteCodeForm
          orgId={data.school.id}
          roles={['student', 'teacher', 'org_admin']}
          sections={activeSections}
        />
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-1">{t('codes.activeTitle', { count: active.length })}</h3>
        <InviteCodeList codes={active} sectionNames={sectionNames} canRevoke={() => true} emptyText={t('codes.noneActive')} />
      </div>

      {past.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-bold text-slate-500">{t('codes.pastTitle', { count: past.length })}</summary>
          <InviteCodeList codes={past} sectionNames={sectionNames} canRevoke={() => false} />
        </details>
      )}
    </div>
  );
}
