import { toast } from 'sonner';
import { functionHeaders, functionError } from '../../../services/edgeFunctions';

export function useSimulationSuggestions(state, subjects, classes) {
  const handleGenerateSuggestions = async () => {
    if (!state.topic.trim()) {
      toast.warning("Please enter a Topic Name first.");
      return;
    }

    state.setIsGeneratingSuggestions(true);
    try {
      const subjectName = subjects.find(s => s.id === state.selectedSubject)?.name || 'Physics';
      const classNameStr = classes.find(c => c.id === state.selectedClass)?.name || '';

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/suggest-requirements`,
        {
          method: 'POST',
          headers: await functionHeaders(),
          body: JSON.stringify({ subject: subjectName, className: classNameStr, topic: state.topic, existingDetails: state.details, imageBase64: state.imageBase64 }),
        }
      );

      if (!response.ok) throw await functionError(response, 'Failed to generate suggestions.');

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      state.setDetails(data.suggestions);
    } catch (err) {
      toast.error(err.message);
    } finally {
      state.setIsGeneratingSuggestions(false);
    }
  };

  return { handleGenerateSuggestions };
}
