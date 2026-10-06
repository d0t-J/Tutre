import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import ur from './locales/ur';

// The interface languages. Urdu is written right to left in Nastaliq; numbers
// stay in Western digits (0-9) in both languages.
export const LANGUAGES = ['en', 'ur'];

const STORAGE_KEY = 'tutre.language';
const CHOSEN_AT_KEY = 'tutre.languageChosenAt';
const URDU_FONT_URL = 'https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;500;600;700&display=swap';

// Browser storage can be unavailable (private windows, blocked site data).
const readStoredLanguage = () => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.includes(value) ? value : null;
  } catch {
    return null;
  }
};

const storeLanguage = (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // Not saved; the profile still remembers it for signed-in users.
  }
};

// When the user last picked a language with the switcher, so a choice made
// before signing in is not overwritten by the profile's older setting.
export const markLanguageChosen = () => {
  try {
    localStorage.setItem(CHOSEN_AT_KEY, String(Date.now()));
  } catch {
    // Without storage the profile's language simply wins.
  }
};

export const readLanguageChosenAt = () => {
  try {
    return Number(localStorage.getItem(CHOSEN_AT_KEY)) || 0;
  } catch {
    return 0;
  }
};

// The Nastaliq font is large, so it is only downloaded once Urdu is chosen.
const loadUrduFont = () => {
  if (document.getElementById('urdu-font')) return;
  const link = document.createElement('link');
  link.id = 'urdu-font';
  link.rel = 'stylesheet';
  link.href = URDU_FONT_URL;
  document.head.appendChild(link);
};

const applyLanguage = (lng) => {
  const root = document.documentElement;
  root.lang = lng;
  root.dir = i18n.dir(lng);
  if (lng === 'ur') loadUrduFont();
  storeLanguage(lng);
};

// First visit: follow the browser. Signed-in users then get their profile's
// language (see useLanguageSync).
const browserLanguage = (navigator.languages ?? [navigator.language])
  .some(l => l?.toLowerCase().startsWith('ur')) ? 'ur' : 'en';

// Wraps text in Unicode "first strong isolate" marks, so a value such as a
// section called "9-A" keeps its own direction inside an Urdu sentence instead
// of being reordered ("A-9"). The marks are invisible.
export const isolate = (value) => `\u2068${value}\u2069`;

i18n.use(initReactI18next).init({
  resources: { en, ur },
  lng: readStoredLanguage() ?? browserLanguage,
  fallbackLng: 'en',
  defaultNS: 'common',
  // React already escapes HTML, so i18next's escaping is used only to isolate
  // every value inserted into a translation (names, codes, dates).
  interpolation: { escapeValue: true, escape: isolate },
});

applyLanguage(i18n.language);
i18n.on('languageChanged', applyLanguage);

// Dates in the interface language, always with Western digits.
export const formatDate = (value, options = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!value) return '';
  const locale = i18n.language === 'ur' ? 'ur-PK-u-nu-latn' : 'en-GB';
  return new Intl.DateTimeFormat(locale, options).format(new Date(value));
};

export default i18n;
