import { toast } from 'sonner';
import { extractDescription } from '../utils/extractDescription';

export function useSimulationUpdate(state, subjects, classes) {
  const handleUpdate = async (updatePromptText, updateTarget = 'both') => {
    if (!updatePromptText.trim() || !state.generatedHtml) return;
    state.setIsUpdating(true);
    state.setSaveSuccess(false);

    try {
      const subjectName = subjects.find(s => s.id === state.selectedSubject)?.name || 'Physics';
      const classNameStr = classes.find(c => c.id === state.selectedClass)?.name || '';
      const functionName = state.dimension === '3D' ? 'generate-simulation-3d' : 'generate-simulation';

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            subject: subjectName,
            className: classNameStr,
            topic: state.topic,
            details: state.details,
            customPrompt: updatePromptText,
            imageBase64: state.imageBase64,
            existingCode: state.generatedHtml,
            updateTarget
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to update simulation. Check your API Key settings.');

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const { cleanedHtml, description } = extractDescription(data.code_payload);

      if (updateTarget === 'description') {
        if (description) state.setGeneratedDescription(description);
      } else if (updateTarget === 'simulation') {
        state.setGeneratedHtml(cleanedHtml);
      } else {
        if (description) state.setGeneratedDescription(description);
        state.setGeneratedHtml(cleanedHtml);
      }

      toast.info("Preview updated! Click 'Update to Student App' to save changes to the database.");
    } catch (err) {
      console.error('Update error:', err);
      toast.error(err.message);
    } finally {
      state.setIsUpdating(false);
    }
  };

  return { handleUpdate };
}
