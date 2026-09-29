import { useRef } from 'react';
import * as Icons from 'lucide-react';
import { useResponsiveScale } from '../../hooks/useResponsiveScale';
import SimulationLoaderOverlay from './loaders/SimulationLoaderOverlay';

export default function ResponsiveSimulationFrame({
  srcDoc,
  title = "Simulation Preview",
  iconName,
  iframeRef,
  iframeLoading,
  setIframeLoading,
  baseWidth = 1024,
  baseHeight = 768,
  padding = 24,
  containerClassName = "flex flex-col lg:flex-1 w-full lg:h-full min-h-0 relative items-center justify-center overflow-hidden",
  wrapperClassName = "bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm flex items-center justify-center shrink-0 relative",
  iframeClassName = "w-full h-full border-none bg-white shadow-md rounded-lg",
  loaderBgClass = "bg-slate-50"
}) {
  const containerRef = useRef(null);
  const { scale, currentPadding } = useResponsiveScale(containerRef, baseWidth, baseHeight, padding);
  const Icon = iconName && Icons[iconName] ? Icons[iconName] : Icons.Settings2;

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
          <SimulationLoaderOverlay Icon={Icon} loaderBgClass={loaderBgClass} />
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
