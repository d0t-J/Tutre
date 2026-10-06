// Codes are stored as 10 characters and shown with a hyphen in the middle.
export const formatCode = (code) => (code ? `${code.slice(0, 5)}-${code.slice(5)}` : '');

export const codeState = (code) => {
  if (code.revoked) return 'revoked';
  if (new Date(code.expires_at) <= new Date()) return 'expired';
  if (code.uses >= code.max_uses) return 'used';
  return 'active';
};

export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';

// School web addresses: lower-case letters and digits in words joined by hyphens.
export const slugFromName = (name) =>
  name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
