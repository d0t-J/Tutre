import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../features/auth';
import { useProfile, useUpdateProfile } from '../features/profile';
import { markLanguageChosen, readLanguageChosenAt } from './index';

// Signed-in users get the language saved in their profile, on every device,
// unless they picked a language on this device after the profile last changed
// (for example on the login page): then that newer choice is saved instead.
export function useLanguageSync() {
  const { i18n } = useTranslation();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const preferred = profile?.preferred_language;
  const updatedAt = profile?.updated_at;

  useEffect(() => {
    if (!preferred || preferred === i18n.language) return;
    if (readLanguageChosenAt() > Date.parse(updatedAt)) {
      updateProfile.mutate({ preferred_language: i18n.language });
    } else {
      i18n.changeLanguage(preferred);
    }
    // Runs when the profile's language or timestamp changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferred, updatedAt]);
}

// Switches the interface language and, when signed in, saves it to the profile.
export function useChangeLanguage() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();

  return (lng) => {
    markLanguageChosen();
    i18n.changeLanguage(lng);
    if (user) updateProfile.mutate({ preferred_language: lng });
  };
}
