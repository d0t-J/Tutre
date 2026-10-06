// Database and API errors arrive in English. The ones a user can actually meet
// are shown in the interface language; anything else gets the caller's fallback
// message, so raw technical text never reaches the screen.
const KNOWN = [
  [/This code is not valid/i, 'errors.invalidCode'],
  [/permission to do that|cannot create this kind of code|No such code|row-level security|permission denied/i, 'errors.permission'],
  [/must keep at least one org admin/i, 'errors.lastAdmin'],
  [/not an active .* of the section's school/i, 'errors.notSchoolMember'],
  [/valid for 1 to 90 days/i, 'errors.codeDays'],
  [/used 1 to 1000 times/i, 'errors.codeUses'],
  [/Sign in required|JWT|session/i, 'errors.signIn'],
  [/duplicate key/i, 'errors.duplicate'],
];

export function translateError(err, t, fallbackKey = 'errors.generic') {
  const message = err?.message ?? '';
  const key = KNOWN.find(([pattern]) => pattern.test(message))?.[1];
  return t(key ? `common:${key}` : fallbackKey);
}
