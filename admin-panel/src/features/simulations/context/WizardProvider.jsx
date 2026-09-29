import { WizardContext } from './WizardContext';
import { useWizardState } from '../hooks/useWizardState';

export const WizardProvider = ({ children }) => {
  const wizardState = useWizardState();

  return (
    <WizardContext.Provider value={wizardState}>
      {children}
    </WizardContext.Provider>
  );
};
