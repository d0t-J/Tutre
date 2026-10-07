import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Loader2, Save } from 'lucide-react';
import { useUpdateProfile } from '../hooks/useProfile';
import { useContentText } from '../../../i18n/content';

const NAME_MAX = 80;

// Each language is named in its own script.
const LANGUAGES = [
  { value: 'en', label: 'English', dir: 'ltr' },
  { value: 'ur', label: 'اردو', dir: 'rtl' },
];

export default function ProfileForm({ profile, email, classes }) {
  const { t } = useTranslation('profile');
  const text = useContentText();
  const [displayName, setDisplayName] = useState(profile.display_name ?? '');
  const [language, setLanguage] = useState(profile.preferred_language ?? 'en');
  const [classId, setClassId] = useState(profile.class_id ?? '');
  const updateProfile = useUpdateProfile();

  const trimmedName = displayName.trim();
  const isDirty =
    trimmedName !== (profile.display_name ?? '') ||
    language !== profile.preferred_language ||
    (classId || null) !== (profile.class_id ?? null);
  const nameError = trimmedName.length === 0 ? t('form.nameRequired') : null;

  // Saving updates the cached profile, and useLanguageSync then applies the
  // chosen language to the interface.
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isDirty || nameError) return;
    updateProfile.mutate(
      { display_name: trimmedName, preferred_language: language, class_id: classId || null },
      {
        onSuccess: () => toast.success(t('form.saved')),
        onError: () => toast.error(t('form.saveFailed')),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('form.email')}</p>
        <p className="text-sm text-slate-700" dir="ltr">{email}</p>
      </div>

      <div>
        <label htmlFor="display-name" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          {t('form.name')}
        </label>
        <input
          id="display-name"
          type="text"
          dir="auto"
          value={displayName}
          maxLength={NAME_MAX}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full text-sm p-2.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-100 outline-none transition-colors"
        />
        <p className="mt-1 text-xs text-slate-400">
          {nameError ?? t('form.nameHint')}
        </p>
      </div>

      <div>
        <label htmlFor="class-id" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          {t('form.class')}
        </label>
        <select
          id="class-id"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="w-full text-sm p-2.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-100 outline-none transition-colors"
        >
          <option value="">{t('form.notSet')}</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{text('class', c.id, c.name)}</option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('form.language')}</legend>
        <div className="flex gap-2">
          {LANGUAGES.map(({ value, label, dir }) => (
            <label
              key={value}
              className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold transition-colors ${
                language === value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="language"
                value={value}
                checked={language === value}
                onChange={() => setLanguage(value)}
                className="sr-only"
              />
              <span dir={dir} lang={value}>{label}</span>
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-slate-400">{t('form.languageHint')}</p>
      </fieldset>

      <button
        type="submit"
        disabled={!isDirty || !!nameError || updateProfile.isPending}
        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {isDirty ? t('form.save') : t('form.upToDate')}
      </button>
    </form>
  );
}
