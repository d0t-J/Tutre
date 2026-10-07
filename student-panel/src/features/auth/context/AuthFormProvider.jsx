import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { translateAuthError } from '../utils/authErrors';
import { useAuth } from './useAuth';
import { AuthFormContext } from './AuthFormContext';
import { STAFF_PORTAL_URL } from '../../../services/portals';

export function AuthFormProvider({ children }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, signup } = useAuth();
  const { t } = useTranslation('auth');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await login(email, password);
        if (error) throw error;
      } else {
        const { error } = await signup(email, password, fullName);
        if (error) throw error;
      }
    } catch (err) {
      // A teacher or principal is offered a way to the staff portal.
      const action = err?.code === 'staff_account' && STAFF_PORTAL_URL
        ? { label: t('errors.openStaffPortal'), onClick: () => window.location.assign(STAFF_PORTAL_URL) }
        : undefined;
      toast.error(translateAuthError(err, t), { action, duration: action ? 10000 : undefined });
      setIsSubmitting(false);
    } 
  };

  return (
    <AuthFormContext.Provider value={{
      isLogin, setIsLogin,
      email, setEmail,
      password, setPassword,
      fullName, setFullName,
      showPassword, setShowPassword,
      isSubmitting, setIsSubmitting,
      handleSubmit
    }}>
      {children}
    </AuthFormContext.Provider>
  );
}
