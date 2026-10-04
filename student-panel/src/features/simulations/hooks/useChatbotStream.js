import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../../services/supabase';
import { readSseStream } from '../utils/streamChatResponse';

export function useChatbotStream(topic, details, messages, setMessages) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
      if (!token) throw new Error('Your session has expired. Please sign in again.');

      const payload = {
        topic,
        details,
        stream: true,
        messages: newMessages
      };

      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/chat-tutor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabase.supabaseKey,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        // 401 (signed out) and 429 (daily limit) carry a message worth showing.
        let message = '';
        try { message = (await response.json())?.error || ''; } catch { /* not JSON */ }
        const error = new Error(message || `Edge function returned ${response.status}`);
        error.userFacing = response.status === 401 || response.status === 429;
        throw error;
      }

      let isFirstChunk = true;
      await readSseStream(response, (fullText) => {
        if (isFirstChunk) {
          isFirstChunk = false;
          setIsLoading(false);
          setMessages(prev => [...prev, { role: 'assistant', content: fullText }]);
        } else {
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: fullText };
            return updated;
          });
        }
      });
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: error.userFacing || error.message.startsWith('Your session')
          ? error.message
          : "I'm sorry, I'm having trouble connecting right now. Please try again later." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return { input, setInput, isLoading, messagesEndRef, handleSubmit };
}
