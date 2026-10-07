import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../../services/supabase';
import { useTranslation } from 'react-i18next';
import { readSseStream } from '../utils/streamChatResponse';

export function useChatbotStream(topic, details, messages, setMessages) {
  const { t, i18n } = useTranslation('simulations');
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
      if (!token) {
        const error = new Error(t('tutor.sessionExpired'));
        error.userFacing = true;
        throw error;
      }

      const payload = {
        topic,
        details,
        stream: true,
        // The tutor replies in the interface language (en or ur).
        language: i18n.language,
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
        // 401 (signed out) and 429 (daily limit) get their own message.
        const key = { 401: 'tutor.sessionExpired', 429: 'tutor.dailyLimit' }[response.status];
        const error = new Error(key ? t(key) : `Edge function returned ${response.status}`);
        error.userFacing = !!key;
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
        content: error.userFacing ? error.message : t('tutor.connectionError')
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return { input, setInput, isLoading, messagesEndRef, handleSubmit };
}
