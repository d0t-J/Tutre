import { Loader2 } from 'lucide-react';
import { useResponsiveSimulationScale } from './hooks/useResponsiveSimulationScale';

/**
 * A generalized viewer that scales fixed-dimension simulations 
 * (like 1024x768) to fit any responsive container without clipping or 
 * scrollbars, maintaining uniform padding.
 */
export default function ResponsiveSimulationFrame({
  srcDoc,
  title = "Simulation Preview",
  iframeRef,
  iframeLoading,
  setIframeLoading,
  baseWidth = 1024,
  baseHeight = 768,
  padding = 48,
  containerClassName = "flex flex-col lg:flex-1 w-full lg:h-full min-h-0 relative items-center justify-center overflow-hidden",
  wrapperClassName = "bg-[#F1F5F9] border-2 border-slate-200 rounded-xl overflow-hidden shadow-inner flex items-center justify-center shrink-0 relative",
  iframeClassName = "w-full h-full border-none bg-white shadow-md rounded-lg",
  loaderBgClass = "bg-[#F1F5F9]"
}) {
  const { containerRef, scale, currentPadding } = useResponsiveSimulationScale({
    baseWidth,
    baseHeight,
    padding
  });

  return (
    <div ref={containerRef} className={containerClassName}>
      <div 
        className={wrapperClassName}
        style={{ 
          width: `${baseWidth * scale + currentPadding}px`, 
          height: `${baseHeight * scale + currentPadding}px`,
        }}
      >
        {iframeLoading && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center z-20 w-full ${loaderBgClass}`}>
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-500 animate-pulse">Loading Simulation...</p>
          </div>
        )}

        <div 
          style={{ 
            width: `${baseWidth * scale}px`, 
            height: `${baseHeight * scale}px`,
            position: 'relative',
            flexShrink: 0
          }}
        >
          <div 
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              transition: 'transform 0.1s ease-out',
              position: 'absolute',
              top: 0,
              left: 0
            }}
          >
            <iframe
              ref={iframeRef}
              title={title}
              srcDoc={srcDoc}
              onLoad={() => {
                if (setIframeLoading) setIframeLoading(false);
              }}
              className={iframeClassName}
              sandbox="allow-scripts"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
