import { useState, useRef, useEffect } from 'react';

export function useSimulationState(classesData) {
  const [selectedClass, setSelectedClass] = useState(null);

  // Derive default selectedClass during render instead of in an effect
  const resolvedClass = selectedClass ?? (classesData.length > 0 ? classesData[0].id : null);

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);

  const [topic, setTopic] = useState('');
  const [details, setDetails] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [imageBase64, setImageBase64] = useState(null);
  const [dimension, setDimension] = useState('2D');
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [studyGuide, setStudyGuide] = useState('');
  
  // Prompt Engine Compartments
  // (Moved to useWizardState.js)

  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [isExtractingDetails, setIsExtractingDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoadedFromSaved, setIsLoadedFromSaved] = useState(false);
  
  const [loadedSimId, setLoadedSimId] = useState(null);
  const [loadedTopicId, setLoadedTopicId] = useState(null);
  const [loadedSubjectId, setLoadedSubjectId] = useState(null);
  const [loadedSubjectName, setLoadedSubjectName] = useState(null);
  const [loadedChapterId, setLoadedChapterId] = useState(null);

  // Track original loaded values to detect unsaved changes
  const [loadedTopic, setLoadedTopic] = useState('');
  const [loadedClassId, setLoadedClassId] = useState(null);
  const [loadedHtml, setLoadedHtml] = useState('');
  const [loadedDescription, setLoadedDescription] = useState('');
  const [loadedStudyGuide, setLoadedStudyGuide] = useState('');

  const isDirty = isLoadedFromSaved && (
    topic !== loadedTopic ||
    resolvedClass !== loadedClassId ||
    selectedSubject !== loadedSubjectId ||
    selectedChapter !== loadedChapterId ||
    generatedHtml !== loadedHtml ||
    generatedDescription !== loadedDescription ||
    studyGuide !== loadedStudyGuide
  );

  // Clear saveSuccess when any tracked field changes
  const prevSaveSuccessDepsRef = useRef([generatedHtml, generatedDescription, topic, resolvedClass, selectedSubject, selectedChapter, studyGuide]);
  useEffect(() => {
    const saveSuccessDeps = [generatedHtml, generatedDescription, topic, resolvedClass, selectedSubject, selectedChapter, studyGuide];
    if (saveSuccess && prevSaveSuccessDepsRef.current.some((dep, i) => dep !== saveSuccessDeps[i])) {
      setSaveSuccess(false);
    }
    prevSaveSuccessDepsRef.current = saveSuccessDeps;
  }, [saveSuccess, generatedHtml, generatedDescription, topic, resolvedClass, selectedSubject, selectedChapter, studyGuide]);

  return {
    selectedClass: resolvedClass, setSelectedClass,
    selectedSubject, setSelectedSubject,
    selectedChapter, setSelectedChapter,
    topic, setTopic,
    details, setDetails,
    customPrompt, setCustomPrompt,
    imageBase64, setImageBase64,
    dimension, setDimension,
    generatedHtml, setGeneratedHtml,
    generatedDescription, setGeneratedDescription,
    isGenerating, setIsGenerating,
    isGeneratingSuggestions, setIsGeneratingSuggestions,
    isExtractingDetails, setIsExtractingDetails,
    isUpdating, setIsUpdating,
    isSaving, setIsSaving,
    saveSuccess, setSaveSuccess,
    isLoadedFromSaved, setIsLoadedFromSaved,
    loadedSimId, setLoadedSimId,
    loadedTopicId, setLoadedTopicId,
    loadedSubjectId, setLoadedSubjectId,
    loadedSubjectName, setLoadedSubjectName,
    loadedChapterId, setLoadedChapterId,
    loadedTopic, setLoadedTopic,
    loadedClassId, setLoadedClassId,
    loadedHtml, setLoadedHtml,
    loadedDescription, setLoadedDescription,
    studyGuide, setStudyGuide,
    loadedStudyGuide, setLoadedStudyGuide,
    isDirty
  };
}
