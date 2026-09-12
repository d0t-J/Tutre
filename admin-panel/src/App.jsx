import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { SimulationProvider } from './features/simulations/context/SimulationProvider';
import { WizardProvider } from './features/simulations/context/WizardProvider';
import { Toaster } from 'sonner';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SimulationProvider>
          <WizardProvider>
            <AppRoutes />
            <Toaster position="top-center" richColors />
          </WizardProvider>
        </SimulationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

