import { supabase } from '../../../services/supabase';
import { toast } from 'sonner';

export function useSimulationStorage(state, _navigate, queryClient, subjects) {
  const handleSave = async () => {
    if (!state.generatedHtml) return;
    if (!state.selectedChapter) {
      toast.error('Please select a chapter before saving.');
      return;
    }
    state.setIsSaving(true);

    try {
      let subjectName = subjects.find(s => s.id === state.selectedSubject)?.name.toLowerCase();

      if (!subjectName) {
        const { data: subData } = await supabase.from('subjects').select('name').eq('id', state.selectedSubject).single();
        if (subData) {
          subjectName = subData.name.toLowerCase();
        } else {
          throw new Error('Please wait for subjects to load or select a valid subject.');
        }
      }

      const tableName = `${subjectName}_simulations`;
      const isUpdating = Boolean(state.loadedSimId && state.loadedTopicId);

      if (isUpdating) {
        if (state.selectedSubject !== state.loadedSubjectId) {
          const oldSubjectName = state.loadedSubjectName ? state.loadedSubjectName.toLowerCase() : 'physics';
          const oldTableName = `${oldSubjectName}_simulations`;

          const { data: newSimData, error: newSimError } = await supabase.from(tableName).insert([{ topic_id: state.loadedTopicId, code_payload: state.generatedHtml }]).select().single();
          if (newSimError) throw newSimError;

          const { data: topicData, error: topicError } = await supabase.from('topics').update({ name: state.topic, description: state.generatedDescription, study_guide: state.studyGuide, subject_id: state.selectedSubject, chapter_id: state.selectedChapter }).eq('id', state.loadedTopicId).select();
          if (topicError) {
            await supabase.from(tableName).delete().eq('id', newSimData.id);
            throw topicError;
          }
          if (!topicData || topicData.length === 0) {
            await supabase.from(tableName).delete().eq('id', newSimData.id);
            throw new Error('Permission denied or topic not found. Ensure you are an admin.');
          }

          await supabase.from(oldTableName).delete().eq('id', state.loadedSimId);

          state.setLoadedSimId(newSimData.id);
          state.setLoadedSubjectId(state.selectedSubject);
          state.setLoadedSubjectName(subjectName);
        } else {
          const { data: topicData, error: topicError } = await supabase.from('topics').update({ name: state.topic, description: state.generatedDescription, study_guide: state.studyGuide, chapter_id: state.selectedChapter }).eq('id', state.loadedTopicId).select();
          if (topicError) throw topicError;
          if (!topicData || topicData.length === 0) throw new Error('Permission denied or topic not found. Ensure you are an admin.');

          const { data: simData, error: simError } = await supabase.from(tableName).update({ code_payload: state.generatedHtml }).eq('id', state.loadedSimId).select();
          if (simError) throw simError;
          if (!simData || simData.length === 0) throw new Error('Permission denied or simulation not found. Ensure you are an admin.');
        }
      } else {
        const description = state.generatedDescription || state.details;
        const { data: topicData, error: topicError } = await supabase.from('topics').insert([{ subject_id: state.selectedSubject, chapter_id: state.selectedChapter, name: state.topic, description, study_guide: state.studyGuide }]).select().single();
        if (topicError) throw topicError;

        const { data: simData, error: simError } = await supabase.from(tableName).insert([{ topic_id: topicData.id, code_payload: state.generatedHtml }]).select().single();
        if (simError) throw simError;

        state.setLoadedTopicId(topicData.id);
        state.setLoadedSimId(simData.id);
      }

      state.setSaveSuccess(true);
      state.setLoadedTopic(state.topic);
      state.setLoadedClassId(state.selectedClass);
      state.setLoadedSubjectId(state.selectedSubject);
      state.setLoadedChapterId(state.selectedChapter);
      state.setLoadedSubjectName(subjectName);
      state.setLoadedHtml(state.generatedHtml);
      state.setLoadedDescription(state.generatedDescription);
      state.setLoadedStudyGuide(state.studyGuide);
      state.setIsLoadedFromSaved(true);

      queryClient.invalidateQueries({ queryKey: ['admin-simulations'] });
      toast.success(isUpdating ? 'Simulation updated successfully in database!' : 'Simulation published successfully to student app!');
      setTimeout(() => state.setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Error saving simulation:', err);
      toast.error(err.message || 'Error saving to database. Please try again.');
    } finally {
      state.setIsSaving(false);
    }
  };

  return { handleSave };
}

