import { useEffect, useRef } from 'react';
import { languageMessage, parseSimulationMessage } from './protocol';

// Connects the app to the simulation in iframeRef. Messages are accepted only
// from that iframe's own window, and only in the shapes protocol.js allows.
// onMessage receives checkpoint, challenge and state messages.
export function useSimulationBridge(iframeRef, { language, onMessage }) {
  const connected = useRef(false);
  const onMessageRef = useRef(onMessage);
  const languageRef = useRef(language);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const post = (message) => {
      // The sandboxed frame has an opaque origin, so '*' is the only target
      // that reaches it. Nothing private is ever sent: only the language.
      iframeRef.current?.contentWindow?.postMessage(message, '*');
    };

    const handle = (event) => {
      const frame = iframeRef.current?.contentWindow;
      if (!frame || event.source !== frame) return;
      const message = parseSimulationMessage(event.data);
      if (!message) return;
      if (message.type === 'ready') {
        connected.current = true;
        post(languageMessage('init', languageRef.current));
        return;
      }
      onMessageRef.current?.(message);
    };

    window.addEventListener('message', handle);
    return () => window.removeEventListener('message', handle);
  }, [iframeRef]);

  // Tell a connected simulation when the interface language changes.
  useEffect(() => {
    languageRef.current = language;
    if (connected.current) {
      iframeRef.current?.contentWindow?.postMessage(languageMessage('language', language), '*');
    }
  }, [language, iframeRef]);
}
