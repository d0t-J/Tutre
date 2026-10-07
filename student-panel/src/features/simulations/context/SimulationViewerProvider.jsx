import { useState, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useFetchSimulation } from '../hooks/useFetchSimulation';
import { useStudyGuideGenerator } from '../hooks/useStudyGuideGenerator';
import { useStudyGuideDocxGenerator } from '../hooks/useStudyGuideDocxGenerator';
import { SimulationViewerContext } from './SimulationViewerContext';
import { useContentText, useTopicTranslation } from '../../../i18n/content';
import { useSimulationBridge } from '../bridge/useSimulationBridge';
import { useProgressReporter } from '../../progress';

export function SimulationViewerProvider({ id, children }) {
  const { simulation: source, loading, messages, setMessages } = useFetchSimulation(id);
  const text = useContentText();
  const topicText = useTopicTranslation(source?.topic_id);

  // What the viewer shows: verified Urdu where it exists, English otherwise.
  // The English originals stay available as *_en; the AI tutor uses those,
  // because the English text is the checked source.
  const simulation = useMemo(() => source && {
    ...source,
    topic: text('topic', source.topic_id, source.topic),
    subject: text('subject', source.subject_id, source.subject),
    description: topicText.description ?? source.description,
    study_guide: topicText.study_guide ?? source.study_guide,
    study_guide_language: topicText.study_guide ? 'ur' : 'en',
    topic_en: source.topic,
    description_en: source.description,
  }, [source, text, topicText.description, topicText.study_guide]);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('guide');
  const iframeRef = useRef(null);
  
  // Learning progress: "explored" is reported by the app; checkpoints and
  // challenges come from Bridge-ready simulations (bridge/protocol.js).
  const { t, i18n } = useTranslation('progress');
  const onLevelUp = useCallback((level) => toast.success(t(`levelUp.${level}`)), [t]);
  const reportBridgeMessage = useProgressReporter(source, iframeRef, onLevelUp);
  useSimulationBridge(iframeRef, { language: i18n.language, onMessage: reportBridgeMessage });

  const { isGeneratingPDF, generateStudyGuideData } = useStudyGuideGenerator(simulation, messages, iframeRef);
  const { isGeneratingDOCX, generateStudyGuideDOCX } = useStudyGuideDocxGenerator(simulation);

  return (
    <SimulationViewerContext.Provider value={{
      simulation,
      loading,
      messages,
      setMessages,
      iframeLoading,
      setIframeLoading,
      activeTab,
      setActiveTab,
      iframeRef,
      isGeneratingPDF,
      generateStudyGuideData,
      isGeneratingDOCX,
      generateStudyGuideDOCX
    }}>
      {children}
    </SimulationViewerContext.Provider>
  );
}
