import { useEffect, useRef } from 'react';
import { useWizard } from '../../../context/WizardContext';
import { useSimulation } from '../../../context/SimulationContext';

export function useWizardSync() {
  const { wizardStep, setWizardStep, setGeneratedPrompt } = useWizard();
  const { topic, details, dimension, loadedSimId, generatedHtml } = useSimulation();

  const prevParams = useRef({ topic, details, dimension });
  const prevLoadedSimId = useRef(loadedSimId);

  // Jump to Workspace step when a saved simulation is loaded, and reset when creating new
  useEffect(() => {
    if (loadedSimId !== prevLoadedSimId.current) {
      if (loadedSimId) {
        setWizardStep(3);
      } else {
        setWizardStep(1);
      }
      prevLoadedSimId.current = loadedSimId;
    }
  }, [loadedSimId, setWizardStep]);

  // Clear generated prompt when core requirements change
  useEffect(() => {
    if (
      topic !== prevParams.current.topic || 
      details !== prevParams.current.details || 
      dimension !== prevParams.current.dimension
    ) {
      setGeneratedPrompt('');
      prevParams.current = { topic, details, dimension };
    }
  }, [topic, details, dimension, setGeneratedPrompt]);

  const isStepClickable = (targetStepId) => {
    if (wizardStep === targetStepId) return false;
    if (wizardStep > targetStepId) return true; // Always allow going backwards
    if (targetStepId === 2) return !!topic; // Can jump to Step 2 if topic is filled
    if (targetStepId === 3) return !!generatedHtml; // Can jump to Step 3 if simulation exists
    return false;
  };

  const handleStepClick = (targetStepId) => {
    if (isStepClickable(targetStepId)) {
      setWizardStep(targetStepId);
    }
  };

  return { wizardStep, isStepClickable, handleStepClick };
}
