// Where the staff portal (the admin-panel app) lives. Set VITE_STAFF_PORTAL_URL
// in .env (a public address, not a secret). Without it, links there are hidden.
export const STAFF_PORTAL_URL = (import.meta.env.VITE_STAFF_PORTAL_URL || '').replace(/\/+$/, '');
