import { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase';

export function useFetchSimulation(id) {
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const fetchSim = async () => {
      const { data, error } = await supabase
        .from('all_simulations')
        .select('*')
        .eq('sim_id', id)
        .single();
        
      if (!error && data) {
        // Fallback: If all_simulations view doesn't include study_guide, fetch it directly
        if (data.study_guide === undefined && data.topic_id) {
          const { data: topicData } = await supabase.from('topics').select('study_guide').eq('id', data.topic_id).single();
          if (topicData) data.study_guide = topicData.study_guide;
        }

        setSimulation(data);
        setMessages([
          {
            role: 'assistant',
            content: `Hello! I am your AI tutor for **${data.topic}**. Do you have any questions about this simulation or topic?`
          }
        ]);
      }
      setLoading(false);
    };
    fetchSim();
  }, [id]);

  return { simulation, loading, messages, setMessages };
}
