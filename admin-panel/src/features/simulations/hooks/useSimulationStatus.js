import { supabase } from '../../../services/supabase';
import { toast } from 'sonner';

// Review workflow for the simulation open in the workspace.
//   draft      -> in_review   author ("Submit for review")
//   in_review  -> draft       author ("Back to draft")
//   draft/in_review -> published   reviewer or platform admin ("Publish")
//   published  -> draft       reviewer or platform admin ("Unpublish")
// The database enforces the same rules (simulations_workflow trigger); the
// buttons only offer what the current Studio role is allowed to do.
const MESSAGES = {
  in_review: 'Submitted for review.',
  draft: 'Moved back to draft.',
  published: 'Published. Students can see it now.',
  archived: 'Archived.',
};

export function useSimulationStatus(state, queryClient) {
  const changeStatus = async (nextStatus) => {
    if (!state.loadedSimId) return;
    if (state.isDirty) {
      toast.warning('Save your changes first, then change the status.');
      return;
    }
    state.setIsChangingStatus(true);
    try {
      const { data, error } = await supabase
        .from('simulations')
        .update({ status: nextStatus })
        .eq('id', state.loadedSimId)
        .select('status');
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Permission denied or simulation not found.');
      state.setLoadedStatus(data[0].status);
      queryClient.invalidateQueries({ queryKey: ['admin-simulations'] });
      const wasPublished = state.loadedStatus === 'published';
      toast.success(
        wasPublished && nextStatus === 'draft'
          ? 'Unpublished. Students no longer see it.'
          : MESSAGES[nextStatus] ?? 'Status changed.'
      );
    } catch (err) {
      toast.error(err.message || 'Could not change the status.');
    } finally {
      state.setIsChangingStatus(false);
    }
  };

  return { changeStatus };
}
