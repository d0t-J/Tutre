import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import common from './locales/en/common.json';
import school from './locales/en/school.json';
import classroom from './locales/en/classroom.json';

// The staff portal's interface text. English only for now: the Urdu staff
// interface is on hold (Phase 3d). The school screens were moved here from the
// student app in Phase 5a and keep its translation keys, so adding Urdu later
// means adding locales/ur without touching the components.

// Wraps text in Unicode "first strong isolate" marks, so a value such as a
// section called "9-A" keeps its own direction inside a sentence. Invisible.
export const isolate = (value) => `⁨${value}⁩`;

i18n.use(initReactI18next).init({
  resources: { en: { common, school, classroom } },
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  // React already escapes HTML, so i18next's escaping only isolates values
  // inserted into a translation (names, codes, dates).
  interpolation: { escapeValue: true, escape: isolate },
});

export const formatDate = (value, options = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-GB', options).format(new Date(value));
};

export default i18n;
