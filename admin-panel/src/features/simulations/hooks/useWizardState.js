import { useState } from 'react';

export function useWizardState() {
  const [viewMode, setViewMode] = useState('classic'); // 'classic' or 'wizard'
  const [wizardStep, setWizardStep] = useState(1); // 1: Requirements, 2: Prompt, 3: Generation
  const [generatedPrompt, setGeneratedPrompt] = useState(''); // The intermediate prompt before HTML generation
  
  // Prompt Engine Compartments
  const [uiTheme, setUiTheme] = useState('modern'); // 'modern', 'playful', 'dark', 'contrast'
  const [animationArchitecture, setAnimationArchitecture] = useState('physics'); // 'physics', 'math', 'node', 'dom'
  const [interactionType, setInteractionType] = useState('slider'); // 'slider', 'drag', 'click'

  return {
    viewMode, setViewMode,
    wizardStep, setWizardStep,
    generatedPrompt, setGeneratedPrompt,
    uiTheme, setUiTheme,
    animationArchitecture, setAnimationArchitecture,
    interactionType, setInteractionType
  };
}
