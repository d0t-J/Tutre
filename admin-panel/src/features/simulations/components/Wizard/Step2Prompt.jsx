import { useSimulation } from '../../context/SimulationContext';
import { useWizard } from '../../context/WizardContext';
import { Terminal, Code2, ArrowRight } from 'lucide-react';
import PromptStyleSelectors from './Step2/PromptStyleSelectors';
import PromptEditor from './Step2/PromptEditor';

export default function Step2Prompt() {
  const { handleGenerate, generatedHtml } = useSimulation();
  const { setWizardStep, generatedPrompt } = useWizard();

  const handleStartGeneration = async () => {
    setWizardStep(3);
    handleGenerate(generatedPrompt);
  };

  return (
    <div className="w-full h-full p-4 flex flex-col">
      <div className="w-full h-full bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col min-h-0">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
              <Terminal className="w-5 h-5 text-primary-500" />
              2. Prompt Engine
            </h3>
            <p className="text-sm text-slate-500">Review and edit the exact instructions that will be sent to the AI.</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-y-auto lg:overflow-hidden p-1">
          <PromptStyleSelectors />
          <PromptEditor />
        </div>

        <div className="flex justify-between items-center mt-auto shrink-0 pt-4 border-t border-slate-100 w-full gap-2">
          <button
            onClick={() => setWizardStep(1)}
            className="px-4 sm:px-6 py-2 sm:py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap"
          >
            Back
          </button>
          <button
            onClick={handleStartGeneration}
            className="flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-8 py-2.5 sm:py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all whitespace-nowrap"
          >
            <Code2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 hidden xs:block" />
            <span className="sm:hidden">{generatedHtml ? 'Regenerate' : 'Generate'}</span>
            <span className="hidden sm:inline">{generatedHtml ? 'Regenerate Simulation' : 'Generate Simulation'}</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          </button>
        </div>

      </div>
    </div>
  );
}
