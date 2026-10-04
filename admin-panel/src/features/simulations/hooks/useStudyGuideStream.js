import { useState } from 'react';
import { supabase } from '../../../services/supabase';
import { toast } from 'sonner';
import { markdownToHtml } from '../utils/markdownToHtml';
import { preprocessLegacyMath } from '../utils/mathPreprocessor';
import { STUDY_GUIDE_PROMPT } from '../utils/studyGuidePrompt';
import { functionHeaders, functionError } from '../../../services/edgeFunctions';

export function useStudyGuideStream(topic, details, setStudyGuide) {
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);

  const generateNotes = async () => {
    if (!topic) {
      toast.error('Please enter a topic first.');
      return;
    }

    setIsGeneratingGuide(true);
    try {
      const payload = {
        topic,
        details,
        stream: true,
        messages: [{ role: 'user', content: STUDY_GUIDE_PROMPT }]
      };

      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/chat-tutor`, {
        method: 'POST',
        headers: await functionHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw await functionError(response, `Edge function returned ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let fullText = '';
      let buffer = '';

      setStudyGuide('');

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          let eolIndex;
          while ((eolIndex = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, eolIndex).trim();
            buffer = buffer.slice(eolIndex + 1);

            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const dataObj = JSON.parse(line.slice(6));
                const content = dataObj.choices?.[0]?.delta?.content || '';
                fullText += content;
              } catch {
                // Ignore incomplete SSE parse errors
              }
            }
          }

          let htmlResult = markdownToHtml(fullText);
          htmlResult = preprocessLegacyMath(htmlResult);
          setStudyGuide(htmlResult);
        }
      }

      toast.success('Study guide generated successfully!');
    } catch (err) {
      console.error('Failed to generate Study Guide:', err);
      toast.error(err.message || 'Failed to generate Study Guide. Please try again.');
    } finally {
      setIsGeneratingGuide(false);
    }
  };

  return { isGeneratingGuide, generateNotes };
}
