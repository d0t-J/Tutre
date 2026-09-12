import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { SimulationContext } from './SimulationContext';
import { useClasses, useSubjects } from '../hooks/useCategories';
import { useSimulationState } from '../hooks/useSimulationState';
import { useSimulationGeneration } from '../hooks/useSimulationGeneration';
import { useSimulationSuggestions } from '../hooks/useSimulationSuggestions';
import { useSimulationUpdate } from '../hooks/useSimulationUpdate';
import { useSimulationStorage } from '../hooks/useSimulationStorage';
import { useSimulationManagement } from '../hooks/useSimulationManagement';
import { useHtmlUpload } from '../hooks/useHtmlUpload';
import { useHtmlDetailsExtraction } from '../hooks/useHtmlDetailsExtraction';

export const SimulationProvider = ({ children }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: classes = [] } = useClasses();
  const state = useSimulationState(classes);
  
  const { data: subjects = [] } = useSubjects(state.selectedClass);
  
  const { selectedSubject, setSelectedSubject } = state;

  useEffect(() => {
    if (subjects.length > 0 && (!selectedSubject || !subjects.find(s => s.id === selectedSubject))) {
      setSelectedSubject(subjects[0].id);
    }
  }, [subjects, selectedSubject, setSelectedSubject]);

  const generationActions = useSimulationGeneration(state, subjects, classes);
  const suggestionActions = useSimulationSuggestions(state, subjects, classes);
  const updateActions = useSimulationUpdate(state, subjects, classes);
  const storageActions = useSimulationStorage(state, navigate, queryClient, subjects);
  const managementActions = useSimulationManagement(state, navigate, queryClient);
  const uploadActions = useHtmlUpload(state);
  const extractionActions = useHtmlDetailsExtraction(state);

  const value = {
    classes,
    subjects,
    ...state,
    ...generationActions,
    ...suggestionActions,
    ...updateActions,
    ...storageActions,
    ...managementActions,
    ...uploadActions,
    ...extractionActions
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
};
