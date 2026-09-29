import { useState } from 'react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { preprocessLegacyMath } from '../../../utils/mathPreprocessor';

export function useStudyGuideGenerator(simulation, _messages, iframeRef) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const generateStudyGuideData = async () => {
    if (!simulation) return null;

    if (!simulation.study_guide || !simulation.study_guide.trim()) {
      toast.error('No study guide found for this simulation.');
      return null;
    }

    setIsGeneratingPDF(true);
    try {
      // 1. Capture Iframe Snapshot
      let snapshotDataUrl = null;
      if (iframeRef?.current && iframeRef.current.contentDocument) {
        const iframeBody = iframeRef.current.contentDocument.body;
        const canvas = await html2canvas(iframeBody, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });
        snapshotDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      }

      // 2. Process the saved HTML study guide from the database
      const htmlContent = preprocessLegacyMath(simulation.study_guide);

      return { htmlContent, snapshotDataUrl };
    } catch (err) {
      console.error('Failed to generate Study Guide data:', err);
      toast.error('Failed to generate Study Guide. Please try again.');
      return null;
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return { isGeneratingPDF, generateStudyGuideData };
}
