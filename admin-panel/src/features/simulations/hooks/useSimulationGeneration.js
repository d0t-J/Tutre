import { toast } from 'sonner';
import { functionHeaders, functionError } from '../../../services/edgeFunctions';
import { extractDescription } from '../utils/extractDescription';

export function useSimulationGeneration(state, subjects, classes) {
  const handleGenerate = async (wizardPrompt = null) => {
    if (!state.topic.trim()) return;
    state.setIsGenerating(true);
    state.setSaveSuccess(false);
    state.setIsLoadedFromSaved(false);
    state.setLoadedSimId(null);
    state.setLoadedTopicId(null);
    state.setGeneratedHtml('');
    state.setGeneratedDescription('');

    try {
      const subjectName = subjects.find(s => s.id === state.selectedSubject)?.name || 'Physics';
      const classNameStr = classes.find(c => c.id === state.selectedClass)?.name || '';

      const functionName = state.dimension === '3D' ? 'generate-simulation-3d' : 'generate-simulation';
      
      const actualWizardPrompt = typeof wizardPrompt === 'string' ? wizardPrompt : null;
      let finalCustomPrompt = actualWizardPrompt || state.customPrompt || '';

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
        {
          method: 'POST',
          headers: await functionHeaders(),
          body: JSON.stringify({ subject: subjectName, className: classNameStr, topic: state.topic, details: state.details, customPrompt: finalCustomPrompt, imageBase64: state.imageBase64 }),
        }
      );

      if (!response.ok) throw await functionError(response, 'Failed to generate simulation.');

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const { cleanedHtml, description } = extractDescription(data.code_payload);

      state.setGeneratedDescription(description);
      state.setGeneratedHtml(cleanedHtml);
    } catch (err) {
      toast.error(err.message);
    } finally {
      state.setIsGenerating(false);
    }
  };

  return { handleGenerate };
}
