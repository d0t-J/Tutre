import { useState, useEffect } from 'react';

export function useResponsiveScale(containerRef, baseWidth, baseHeight, defaultPadding) {
  const [scale, setScale] = useState(1);
  const [currentPadding, setCurrentPadding] = useState(defaultPadding);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        
        // Dynamically reduce padding on small screens (mobile)
        const dynamicPadding = width < 640 ? 16 : defaultPadding;
        setCurrentPadding(dynamicPadding);

        // Subtract the padding space from available dimensions
        const availableWidth = Math.max(0, width - dynamicPadding);
        const availableHeight = Math.max(0, height - dynamicPadding);
        
        const scaleW = availableWidth / baseWidth;
        const scaleH = availableHeight / baseHeight;
        
        setScale(Math.min(scaleW, scaleH, 1));
      }
    });
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, [baseWidth, baseHeight, defaultPadding, containerRef]);

  return { scale, currentPadding };
}
