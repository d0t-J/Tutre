import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useChangeLanguage } from '../../i18n/useLanguage';

// One button that switches to the other language. Its label is always written
// in the language it switches to, so it can be found by someone who cannot read
// the current one.
export default function LanguageSwitcher({ className = '' }) {
  const { i18n, t } = useTranslation();
  const changeLanguage = useChangeLanguage();
  const next = i18n.language === 'ur' ? 'en' : 'ur';

  return (
    <button
      type="button"
      onClick={() => changeLanguage(next)}
      title={t('language.switch')}
      aria-label={t('language.switch')}
      className={`cursor-pointer flex items-center gap-1.5 p-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors ${className}`}
    >
      <Languages className="w-4 h-4 shrink-0" />
      <span lang={next} dir={next === 'ur' ? 'rtl' : 'ltr'}>{next === 'ur' ? 'اردو' : 'English'}</span>
    </button>
  );
}
