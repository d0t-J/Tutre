import { useState, useEffect } from 'react';
import { useWizard } from '../../../context/WizardContext';
import { useSimulation } from '../../../context/SimulationContext';
import { FileCode2, Sparkles } from 'lucide-react';
import { supabase } from '../../../../../services/supabase';
import { toast } from 'sonner';

export default function PromptEditor() {
  const { topic, details, dimension } = useSimulation();
  const { 
    generatedPrompt, setGeneratedPrompt,
    uiTheme, animationArchitecture, interactionType
  } = useWizard();
  
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Auto-generate the base prompt when arriving at this step if empty
  useEffect(() => {
    if (!generatedPrompt) {
      const base = `Simulation Blueprint: ${topic}

### Core Objectives
${details || 'Create an intuitive and highly engaging educational experience that clearly demonstrates the core concepts.'}

### Visual & Stylistic Approach
- Dimension: ${dimension} environment.`;
      setGeneratedPrompt(base);
    }
  }, [topic, details, dimension, generatedPrompt, setGeneratedPrompt]);

  const triggerMagicEnhance = async () => {
    setIsEnhancing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-simulation-prompt', {
        body: { topic, details, uiTheme, animationArchitecture, interactionType, dimension }
      });

      if (error) throw error;
      if (data && data.prompt) {
        setGeneratedPrompt(data.prompt);
      }
    } catch (err) {
      console.error("Error generating prompt:", err);
      toast.error('Magic Enhance failed — using a generated prompt instead.');
      const fallback = `Simulation Blueprint: ${topic}

### Core Objectives
${details || 'Create an intuitive and highly engaging educational experience that clearly demonstrates the core concepts.'}

### Visual & Stylistic Approach
- Theme: ${uiTheme}
- Dimension: ${dimension} environment.

### Interaction & Behavior
- User Controls: ${interactionType}
- Environment Style: ${animationArchitecture}`;
      setGeneratedPrompt(fallback);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="w-full lg:w-[55%] flex flex-col relative h-full min-h-[300px] lg:min-h-0">
      <div className="flex items-center justify-end gap-2 mb-2 shrink-0">
        <button
          onClick={triggerMagicEnhance}
          disabled={isEnhancing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all disabled:opacity-50"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} />
          {isEnhancing ? 'Enhancing...' : 'Magic Enhance'}
        </button>
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 shadow-sm rounded-md text-[10px] font-mono text-slate-500 font-bold">
          <FileCode2 className="w-3 h-3 text-primary-500" /> system_prompt.txt
        </div>
      </div>
      <textarea
        value={generatedPrompt}
        onChange={e => setGeneratedPrompt(e.target.value)}
        className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 text-slate-700 font-mono text-sm leading-relaxed rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 resize-none transition-all h-full custom-scrollbar"
        spellCheck="false"
      />
    </div>
  );
}
