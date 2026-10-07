import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../auth';

// Learning progress (Phase 4). Levels only ever go up:
//   explored   used the simulation (a minute in view, or a click into it)
//   practised  reached every checkpoint, or attempted enough challenges
//   mastered   answered enough challenges correctly
// The database works the level out (record_learning_event); the app only reports.

export const LEVELS = ['explored', 'practised', 'mastered'];
export const levelRank = (level) => LEVELS.indexOf(level) + 1;

const EXPLORED_AFTER_MS = 60 * 1000;
const MAX_REPORTS_PER_MINUTE = 30;

// The signed-in student's progress, as { [topicId]: { level, updated_at } }.
export function useMyProgress() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-progress', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('topic_progress')
        .select('topic_id, level, explored_at, practised_at, mastered_at, updated_at');
      if (error) throw new Error(error.message);
      return Object.fromEntries(data.map(row => [row.topic_id, row]));
    },
    enabled: !!user,
    staleTime: 1000 * 60,
  });
}

// Per chapter of one subject: how many topics have a published simulation, and
// how many of those the student has explored, practised and mastered.
export function useChapterProgress(subjectId) {
  const { user } = useAuth();
  const { data: progress = {} } = useMyProgress();
  const { data: topics = [] } = useQuery({
    queryKey: ['subject-topics', subjectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('all_simulations')
        .select('topic_id, chapter_id')
        .eq('subject_id', subjectId);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user && !!subjectId,
    staleTime: 1000 * 60 * 30,
  });

  const byChapter = {};
  for (const { topic_id: topicId, chapter_id: chapterId } of topics) {
    if (!chapterId) continue;
    const entry = byChapter[chapterId] ?? { total: 0, explored: 0, practised: 0, mastered: 0 };
    entry.total += 1;
    const rank = levelRank(progress[topicId]?.level);
    if (rank >= 1) entry.explored += 1;
    if (rank >= 2) entry.practised += 1;
    if (rank >= 3) entry.mastered += 1;
    byChapter[chapterId] = entry;
  }
  return byChapter;
}

// Reports progress for the simulation open in the viewer. Returns
// reportBridgeMessage(message) for checkpoint and challenge messages from the
// simulation; "explored" is reported by the app itself. onLevelUp(level) is
// called when the topic reaches a higher level.
export function useProgressReporter(simulation, iframeRef, onLevelUp) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const simulationId = simulation?.sim_id;
  const sent = useRef([]);
  const exploredSent = useRef(false);
  const onLevelUpRef = useRef(onLevelUp);

  useEffect(() => {
    onLevelUpRef.current = onLevelUp;
  }, [onLevelUp]);

  const report = useCallback(async (kind, ref = null, correct = null) => {
    if (!user || !simulationId) return;
    // A buggy simulation must not flood the database; the server limits too.
    const now = Date.now();
    sent.current = sent.current.filter(at => now - at < 60 * 1000);
    if (sent.current.length >= MAX_REPORTS_PER_MINUTE) return;
    sent.current.push(now);

    const { data, error } = await supabase.rpc('record_learning_event', {
      p_simulation: simulationId,
      p_kind: kind,
      p_ref: ref,
      p_correct: correct,
    });
    if (error) {
      // Unknown ids or unpublished previews are expected now and then; progress
      // is never worth interrupting the student for.
      console.warn('Progress not recorded:', error.message);
      return;
    }
    if (data?.changed) {
      queryClient.invalidateQueries({ queryKey: ['my-progress'] });
      onLevelUpRef.current?.(data.level);
    }
  }, [user, simulationId, queryClient]);

  // Explored: a minute with the page visible, or a click into the simulation.
  useEffect(() => {
    exploredSent.current = false;
    if (!simulationId) return undefined;
    let visibleMs = 0;
    let last = Date.now();

    const markExplored = () => {
      if (exploredSent.current) return;
      exploredSent.current = true;
      report('explored');
    };
    const timer = setInterval(() => {
      const now = Date.now();
      if (document.visibilityState === 'visible') visibleMs += now - last;
      last = now;
      if (visibleMs >= EXPLORED_AFTER_MS) markExplored();
    }, 5000);
    // Clicking into the iframe moves focus out of this window.
    const onBlur = () => {
      setTimeout(() => {
        if (iframeRef.current && document.activeElement === iframeRef.current) markExplored();
      }, 0);
    };
    window.addEventListener('blur', onBlur);
    return () => {
      clearInterval(timer);
      window.removeEventListener('blur', onBlur);
    };
  }, [simulationId, iframeRef, report]);

  return useCallback((message) => {
    if (message.type === 'checkpoint') report('checkpoint', message.id);
    else if (message.type === 'challenge') report('challenge', message.id, message.correct);
  }, [report]);
}
