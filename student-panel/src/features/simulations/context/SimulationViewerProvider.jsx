import { useState, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import i18n from '../../../i18n';
import { useFetchSimulation } from '../hooks/useFetchSimulation';
import { useStudyGuideGenerator } from '../hooks/useStudyGuideGenerator';
import { useStudyGuideDocxGenerator } from '../hooks/useStudyGuideDocxGenerator';
import { SimulationViewerContext } from './SimulationViewerContext';
import { useContentText, useTopicTranslation } from '../../../i18n/content';
import { useSimulationBridge } from '../bridge/useSimulationBridge';
import { useProgressReporter } from '../../progress';

// The viewer for whatever `source` is: a Tutre simulation (with learning
// progress) or a teacher's simulation (Phase 5e: no progress tracking, and its
// title and description are the teacher's own words, never replaced by
// Tutre's curriculum translations).
function ViewerStateProvider({ source, loading, messages, setMessages, children }) {
  const isTeacherMaterial = !!source?.isTeacherMaterial;
  const text = useContentText();
  const topicText = useTopicTranslation(isTeacherMaterial ? null : source?.topic_id);

  // What the viewer shows: verified Urdu where it exists, English otherwise.
  // The English originals stay available as *_en; the AI tutor uses those,
  // because the English text is the checked source.
  const simulation = useMemo(() => source && (isTeacherMaterial ? {
    ...source,
    subject: text('subject', source.subject_id, source.subject),
    study_guide_language: source.language,
    topic_en: source.topic,
    description_en: source.description,
  } : {
    ...source,
    topic: text('topic', source.topic_id, source.topic),
    subject: text('subject', source.subject_id, source.subject),
    description: topicText.description ?? source.description,
    study_guide: topicText.study_guide ?? source.study_guide,
    study_guide_language: topicText.study_guide ? 'ur' : 'en',
    topic_en: source.topic,
    description_en: source.description,
  }), [source, isTeacherMaterial, text, topicText.description, topicText.study_guide]);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('guide');
  const iframeRef = useRef(null);

  // Learning progress: "explored" is reported by the app; checkpoints and
  // challenges come from Bridge-ready simulations (bridge/protocol.js).
  // Teachers' simulations are not tracked (decided 2026-10-08).
  const { t, i18n: i18nInstance } = useTranslation('progress');
  const onLevelUp = useCallback((level) => toast.success(t(`levelUp.${level}`)), [t]);
  const reportBridgeMessage = useProgressReporter(isTeacherMaterial ? null : source, iframeRef, onLevelUp);
  useSimulationBridge(iframeRef, { language: i18nInstance.language, onMessage: reportBridgeMessage });

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

export function SimulationViewerProvider({ id, children }) {
  const { simulation, loading, messages, setMessages } = useFetchSimulation(id);
  return (
    <ViewerStateProvider source={simulation} loading={loading} messages={messages} setMessages={setMessages}>
      {children}
    </ViewerStateProvider>
  );
}

// source: a teacher's simulation, already loaded (toViewerSource in
// features/materials). Mount it with key={source.sim_id}.
export function TeacherSimulationViewerProvider({ source, children }) {
  const [messages, setMessages] = useState(() => [{
    role: 'assistant',
    greeting: true,
    content: i18n.t('simulations:tutor.greeting', { topic: source.topic }),
  }]);
  return (
    <ViewerStateProvider source={source} loading={false} messages={messages} setMessages={setMessages}>
      {children}
    </ViewerStateProvider>
  );
}
