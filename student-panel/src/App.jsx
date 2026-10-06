import { AuthProvider } from './features/auth';
import { Toaster } from 'sonner';
import AppRoutes from './routes/AppRoutes';
import { useLanguageSync } from './i18n/useLanguage';

function LanguageSync() {
  useLanguageSync();
  return null;
}

function App() {
  return (
    <AuthProvider>
      <LanguageSync />
      <AppRoutes />
      <Toaster position="top-center" richColors />
    </AuthProvider>
  );
}

export default App;