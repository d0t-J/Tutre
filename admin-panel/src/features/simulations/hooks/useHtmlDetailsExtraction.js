import { toast } from 'sonner';
import { functionHeaders, functionError } from '../../../services/edgeFunctions';

export function useHtmlDetailsExtraction(state) {
  const handleExtractDetails = async () => {
    if (!state.generatedHtml) {
      toast.warning("No HTML available to extract details from.");
      return;
    }

    state.setIsExtractingDetails(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-html-details`,
        {
          method: 'POST',
          headers: await functionHeaders(),
          body: JSON.stringify({ htmlContent: state.generatedHtml }),
        }
      );

      if (!response.ok) throw await functionError(response, 'Failed to extract details from HTML.');

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      if (data.topic) {
        state.setTopic(data.topic);
      }
      if (data.details) {
        state.setDetails(data.details);
      }
      
      toast.success('Successfully extracted details from HTML.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      state.setIsExtractingDetails(false);
    }
  };

  return { handleExtractDetails };
}
