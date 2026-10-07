// Moved from the student app to the staff portal in Phase 5a.

// Components
export { InviteCodeList, CreateInviteCodeForm, CopyCodeButton } from './components/InviteCodes';
export { default as TeachingSection } from './components/TeachingSection';
export { default as SchoolOverviewTab } from './components/SchoolOverviewTab';
export { default as SchoolMembersTab } from './components/SchoolMembersTab';
export { default as SchoolSectionsTab } from './components/SchoolSectionsTab';
export { default as SchoolCodesTab } from './components/SchoolCodesTab';

// Hooks
export { useTeaching } from './hooks/useTeaching';
export { useSchoolAdmin } from './hooks/useSchoolAdmin';
export { useAdminSchools } from './hooks/useAdminSchools';
export { useRedeemCode, peekInviteCode } from './hooks/useSchoolActions';
