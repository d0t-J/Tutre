import { useRef, useState, useEffect } from 'react';

/**
 * Custom hook to measure container size with ResizeObserver and calculate 
 * proportional uniform scale and dynamic padding for simulation canvas.
 */
export function useResponsiveSimulationScale({ baseWidth, baseHeight, padding }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [currentPadding, setCurrentPadding] = useState(padding);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        
        // Dynamically reduce padding on mobile (< 640px)
        const dynamicPadding = width < 640 ? 16 : padding;
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
  }, [baseWidth, baseHeight, padding]);

  return { containerRef, scale, currentPadding };
}
