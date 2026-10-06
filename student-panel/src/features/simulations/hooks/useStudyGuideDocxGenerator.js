import { useState } from 'react';
import { toast } from 'sonner';
import i18n from '../../../i18n';
import { preprocessMathForDocx } from '../../../utils/mathPreprocessor';
import { formatHtmlForWord, buildWordDocumentHtml } from '../utils/wordExportFormatter';

export function useStudyGuideDocxGenerator(simulation) {
  const [isGeneratingDOCX, setIsGeneratingDOCX] = useState(false);

  const generateStudyGuideDOCX = async (options = { returnBlob: false }) => {
    if (!simulation) return null;

    if (!simulation.study_guide || !simulation.study_guide.trim()) {
      toast.error(i18n.t('simulations:export.noGuide'));
      return null;
    }

    setIsGeneratingDOCX(true);
    try {
      // Convert LaTeX math delimiters ($math$, $$math$$) to MathML for Word
      const rawHtml = preprocessMathForDocx(simulation.study_guide);

      // Enhance table and blockquote markup with Word-compatible inline styling
      const formattedBody = formatHtmlForWord(rawHtml);

      // Build complete Word HTML document with MSO styles and brand theme
      const fullHtml = buildWordDocumentHtml(
        simulation.topic,
        simulation.subject,
        formattedBody
      );

      const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
      
      if (options.returnBlob) {
        return blob;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${simulation.topic.replace(/\s+/g, '_')}_Study_Guide.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(i18n.t('simulations:export.wordDone'));
    } catch (err) {
      console.error('Failed to generate Word document:', err);
      toast.error(i18n.t('simulations:export.failed'));
      return null;
    } finally {
      setIsGeneratingDOCX(false);
    }
  };

  return { isGeneratingDOCX, generateStudyGuideDOCX };
}
