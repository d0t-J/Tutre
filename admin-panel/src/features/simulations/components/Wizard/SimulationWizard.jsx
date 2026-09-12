import { useWizardSync } from './hooks/useWizardSync';
import WizardStepper from './components/WizardStepper';
import Step1Requirements from './Step1Requirements';
import Step2Prompt from './Step2Prompt';
import Step3Workspace from './Step3Workspace';

export default function SimulationWizard() {
  const { wizardStep, isStepClickable, handleStepClick } = useWizardSync();

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      <WizardStepper 
        wizardStep={wizardStep} 
        isStepClickable={isStepClickable} 
        handleStepClick={handleStepClick} 
      />

      <div className="flex-1 overflow-y-auto">
        <div className="h-full w-full mx-auto">
          {wizardStep === 1 && <Step1Requirements />}
          {wizardStep === 2 && <Step2Prompt />}
          {wizardStep === 3 && <Step3Workspace />}
        </div>
      </div>
    </div>
  );
}
