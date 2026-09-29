import { AuthProvider } from './features/auth';
import { Toaster } from 'sonner';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster position="top-center" richColors />
    </AuthProvider>
  );
}

export default App;