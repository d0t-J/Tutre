// Where the other Tutre app lives. Set VITE_STUDENT_APP_URL in .env (it is a
// public address, not a secret). Without it, links to the student app are hidden.
export const STUDENT_APP_URL = (import.meta.env.VITE_STUDENT_APP_URL || '').replace(/\/+$/, '');
