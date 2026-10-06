// Shared helpers for the school screens (joining, My sections, My school).
// Role names are translated as common:roles.<role>.

export { formatDate } from '../../../i18n';

// Codes are stored as 10 characters and shown with a hyphen in the middle.
export const formatCode = (code) => (code ? `${code.slice(0, 5)}-${code.slice(5)}` : '');

export const codeState = (code) => {
  if (code.revoked) return 'revoked';
  if (new Date(code.expires_at) <= new Date()) return 'expired';
  if (code.uses >= code.max_uses) return 'usedUp';
  return 'active';
};

export const byName = (a, b) =>
  (a.name ?? '').localeCompare(b.name ?? '', undefined, { numeric: true, sensitivity: 'base' });

// An update or delete that RLS filters out returns no rows instead of an error.
export const requireRows = (data, message = "You don't have permission to do that.") => {
  // The English message is matched by translateError and shown translated.
  if (!data || data.length === 0) throw new Error(message);
  return data;
};

export const inputClass =
  'w-full text-sm p-2.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-100 outline-none transition-colors';

export const labelClass = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5';

export const primaryButtonClass =
  'cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

export const secondaryButtonClass =
  'cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

export const dangerButtonClass =
  'cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';
