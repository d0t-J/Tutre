// Database and API errors arrive as technical English. The ones a user can
// actually meet get a clear message; anything else gets the caller's fallback,
// so raw technical text never reaches the screen.
const KNOWN = [
  [/already joined/i, 'errors.alreadyJoined'],
  [/cannot reset this person/i, 'errors.cannotReset'],
  [/Too many reset codes/i, 'errors.tooManyResets'],
  [/You cannot decide this request/i, 'errors.permission'],
  [/This code is not valid/i, 'errors.invalidCode'],
  [/head admin cannot be removed/i, 'errors.headCannotBeRemoved'],
  [/Only the school's head admin or Tutre/i, 'errors.headOnly'],
  [/Only an active teacher of this school can be made an admin/i, 'errors.adminMustBeTeacher'],
  [/Only an active admin of this school can become its head/i, 'errors.headMustBeAdmin'],
  [/permission to do that|cannot create this kind of code|cannot appoint admins|No such code|row-level security|permission denied/i, 'errors.permission'],
  [/must keep at least one org admin/i, 'errors.lastAdmin'],
  [/not an active .* of the section's school/i, 'errors.notSchoolMember'],
  [/valid for 1 to 90 days/i, 'errors.codeDays'],
  [/used 1 to 1000 times/i, 'errors.codeUses'],
  [/Only the author can edit this material/i, 'errors.authorOnly'],
  [/topic must belong to the chosen chapter/i, 'errors.topicChapter'],
  [/no notes to copy/i, 'errors.noNotes'],
  [/not in a chapter/i, 'errors.noChapter'],
  [/Daily limit reached[^]*/i, 'errors.dailyLimit'],
  [/Sign in required|JWT|session/i, 'errors.signIn'],
  [/duplicate key/i, 'errors.duplicate'],
];

export function translateError(err, t, fallbackKey = 'errors.generic') {
  const message = err?.message ?? '';
  const key = KNOWN.find(([pattern]) => pattern.test(message))?.[1];
  return t(key ? `common:${key}` : fallbackKey);
}
