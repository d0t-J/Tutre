import { useState, useRef } from 'react';
import { useFetchSimulation } from '../hooks/useFetchSimulation';
import { useStudyGuideGenerator } from '../hooks/useStudyGuideGenerator';
import { useStudyGuideDocxGenerator } from '../hooks/useStudyGuideDocxGenerator';
import { SimulationViewerContext } from './SimulationViewerContext';

export function SimulationViewerProvider({ id, children }) {
  const { simulation, loading, messages, setMessages } = useFetchSimulation(id);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('guide');
  const iframeRef = useRef(null);
  
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
