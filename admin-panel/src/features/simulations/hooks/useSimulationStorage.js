import { supabase } from '../../../services/supabase';
import { toast } from 'sonner';

// Saves the workspace to topics + simulations (one table for every subject since
// Phase 2b). A new simulation is saved as a draft; publishing is a separate step
// (useSimulationStatus). Saving changes to a published simulation updates the live
// version, which the database records in simulation_versions so it can be undone.
export function useSimulationStorage(state, _navigate, queryClient, subjects) {
  const handleSave = async () => {
    if (!state.generatedHtml) return;
    if (!state.selectedChapter) {
      toast.error('Please select a chapter before saving.');
      return;
    }
    state.setIsSaving(true);

    try {
      const subjectSlug = subjects.find(s => s.id === state.selectedSubject)?.slug ?? null;
      const isUpdating = Boolean(state.loadedSimId && state.loadedTopicId);

      if (isUpdating) {
        // Moving to another subject is now just a change to the topic: the
        // simulation row stays where it is.
        const { data: topicData, error: topicError } = await supabase
          .from('topics')
          .update({
            name: state.topic,
            description: state.generatedDescription,
            study_guide: state.studyGuide,
            subject_id: state.selectedSubject,
            chapter_id: state.selectedChapter,
          })
          .eq('id', state.loadedTopicId)
          .select();
        if (topicError) throw topicError;
        if (!topicData || topicData.length === 0) throw new Error('Permission denied or topic not found. Ensure you are an admin.');

        if (state.generatedHtml !== state.loadedHtml) {
          const { data: simData, error: simError } = await supabase
            .from('simulations')
            .update({ code_payload: state.generatedHtml })
            .eq('id', state.loadedSimId)
            .select('status');
          if (simError) throw simError;
          if (!simData || simData.length === 0) throw new Error('Permission denied or simulation not found. Ensure you are an admin.');
        }
      } else {
        const description = state.generatedDescription || state.details;
        const { data: topicData, error: topicError } = await supabase
          .from('topics')
          .insert([{ subject_id: state.selectedSubject, chapter_id: state.selectedChapter, name: state.topic, description, study_guide: state.studyGuide }])
          .select()
          .single();
        if (topicError) throw topicError;

        const { data: simData, error: simError } = await supabase
          .from('simulations')
          .insert([{ topic_id: topicData.id, code_payload: state.generatedHtml, status: 'draft' }])
          .select('id, status')
          .single();
        if (simError) {
          await supabase.from('topics').delete().eq('id', topicData.id);
          throw simError;
        }

        state.setLoadedTopicId(topicData.id);
        state.setLoadedSimId(simData.id);
        state.setLoadedStatus(simData.status);
      }

      state.setSaveSuccess(true);
      state.setLoadedTopic(state.topic);
      state.setLoadedClassId(state.selectedClass);
      state.setLoadedSubjectId(state.selectedSubject);
      state.setLoadedChapterId(state.selectedChapter);
      state.setLoadedSubjectSlug(subjectSlug);
      state.setLoadedHtml(state.generatedHtml);
      state.setLoadedDescription(state.generatedDescription);
      state.setLoadedStudyGuide(state.studyGuide);
      state.setIsLoadedFromSaved(true);

      queryClient.invalidateQueries({ queryKey: ['admin-simulations'] });
      if (!isUpdating) {
        toast.success('Saved as a draft. Students will see it once it is published.');
      } else if (state.loadedStatus === 'published') {
        toast.success('Saved. The live version students see has been updated.');
      } else {
        toast.success('Saved.');
      }
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
