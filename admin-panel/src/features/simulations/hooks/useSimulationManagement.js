import { supabase } from '../../../services/supabase';
import { toast } from 'sonner';

export function useSimulationManagement(state, navigate, queryClient) {
  const loadSavedSimulation = async (sim) => {
    state.setSelectedClass(sim.class_id);
    state.setSelectedSubject(sim.subject_id);
    state.setSelectedChapter(sim.chapter_id);
    state.setTopic(sim.topic);
    state.setGeneratedHtml(sim.code_payload);
    state.setGeneratedDescription(sim.description || '');
    
    // Fallback: If the all_simulations view hasn't been updated to include study_guide, fetch it directly
    let studyGuide = sim.study_guide;
    if (studyGuide === undefined && sim.topic_id) {
      const { data } = await supabase.from('topics').select('study_guide').eq('id', sim.topic_id).single();
      if (data) studyGuide = data.study_guide;
    }
    state.setStudyGuide(studyGuide || '');
    
    state.setImageBase64(null);
    state.setDetails('');
    state.setCustomPrompt('');
    state.setSaveSuccess(false);
    state.setIsLoadedFromSaved(true);
    state.setLoadedSimId(sim.sim_id);
    state.setLoadedStatus(sim.status ?? null);
    state.setLoadedTopicId(sim.topic_id);
    state.setLoadedSubjectId(sim.subject_id);
    state.setLoadedChapterId(sim.chapter_id);
    state.setLoadedSubjectSlug(sim.subject_slug);
    state.setLoadedClassId(sim.class_id);
    state.setLoadedTopic(sim.topic);
    state.setLoadedHtml(sim.code_payload);
    state.setLoadedDescription(sim.description || '');
    state.setLoadedStudyGuide(studyGuide || '');
    navigate('/');
  };

  const deleteSimulation = async (sim) => {
    try {
      // Delete the simulation first: the database decides whether this Studio
      // member may (reviewers may delete anything, authors only their own drafts).
      // Only then remove its topic.
      const { data: deleted, error: simError } = await supabase
        .from('simulations')
        .delete()
        .eq('id', sim.sim_id)
        .select('id');
      if (simError) throw simError;
      if (!deleted || deleted.length === 0) {
        throw new Error('You can only delete your own drafts. Ask a reviewer to delete this one.');
      }

      const { error: topicError } = await supabase.from('topics').delete().eq('id', sim.topic_id);
      if (topicError) throw topicError;

      if (state.loadedSimId === sim.sim_id) {
        handleCreateNew();
      }

      queryClient.invalidateQueries({ queryKey: ['admin-simulations'] });
    } catch (err) {
      toast.error('Error deleting simulation: ' + err.message);
    }
  };

  const handleCreateNew = () => {
    state.setTopic('');
    state.setDetails('');
    state.setCustomPrompt('');
    state.setImageBase64(null);
    state.setGeneratedHtml('');
    state.setGeneratedDescription('');
    state.setStudyGuide('');
    state.setIsLoadedFromSaved(false);
    state.setDimension('2D');
    state.setLoadedSimId(null);
    state.setLoadedStatus(null);
    state.setLoadedTopicId(null);
    state.setLoadedSubjectId(null);
    state.setLoadedChapterId(null);
    state.setLoadedSubjectSlug(null);
    state.setLoadedTopic('');
    state.setLoadedClassId(null);
    state.setLoadedHtml('');
    state.setLoadedDescription('');
    state.setLoadedStudyGuide('');
    state.setSaveSuccess(false);
  };

  return { loadSavedSimulation, deleteSimulation, handleCreateNew };
}
