// Supabase Auth reports errors in English. Known ones are shown in the
// interface language; anything else falls back to a general message.
const BY_CODE = {
  staff_account: 'errors.staffAccount',
  invalid_credentials: 'errors.invalidCredentials',
  user_already_exists: 'errors.userExists',
  email_exists: 'errors.userExists',
  weak_password: 'errors.weakPassword',
  email_not_confirmed: 'errors.emailNotConfirmed',
  over_email_send_rate_limit: 'errors.rateLimited',
  over_request_rate_limit: 'errors.rateLimited',
  email_address_invalid: 'errors.invalidEmail',
  validation_failed: 'errors.invalidEmail',
};

const BY_MESSAGE = [
  [/invalid login credentials/i, 'errors.invalidCredentials'],
  [/already registered/i, 'errors.userExists'],
  [/password should be/i, 'errors.weakPassword'],
  [/email not confirmed/i, 'errors.emailNotConfirmed'],
  [/rate limit/i, 'errors.rateLimited'],
  [/unable to validate email|invalid format/i, 'errors.invalidEmail'],
  [/unable to verify account type/i, 'errors.accountCheck'],
];

export function translateAuthError(err, t) {
  const key = BY_CODE[err?.code] ?? BY_MESSAGE.find(([pattern]) => pattern.test(err?.message ?? ''))?.[1];
  return t(key ?? 'errors.generic');
}
