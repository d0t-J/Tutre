import { useState, useEffect, useRef, useCallback } from 'react';

export function useIframeHeight(generatedHtml) {
  const [iframeLoading, setIframeLoading] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const prevHtmlRef = useRef(generatedHtml);

  // Reset loading/height when generatedHtml changes
  useEffect(() => {
    if (generatedHtml && generatedHtml !== prevHtmlRef.current) {
      setIframeLoading(true);
      setContentHeight(0);
    }
    prevHtmlRef.current = generatedHtml;
  }, [generatedHtml]);

  // Listen for postMessage from the iframe to get its content height
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data && e.data.type === 'sim-content-height' && typeof e.data.height === 'number') {
        setContentHeight(e.data.height);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Observe the container's available height using ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isDesktop = containerHeight > 0 && window.innerWidth >= 1024;

  const getIframeStyle = useCallback(() => {
    if (!contentHeight || contentHeight <= 0) {
      return { width: '100%', height: '100%', border: 'none' };
    }

    if (isDesktop) {
      return { width: '100%', height: '100%', border: 'none' };
    }

    return {
      width: '100%',
      height: `${contentHeight}px`,
      border: 'none',
    };
  }, [contentHeight, isDesktop]);

  return {
    iframeLoading,
    setIframeLoading,
    containerRef,
    iframeRef,
    getIframeStyle
  };
}
