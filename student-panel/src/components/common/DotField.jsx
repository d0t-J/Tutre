import { memo } from 'react';

const DotField = memo(({
  dotRadius = 1.5,
  dotSpacing = 14,
  dotColor = 'rgba(0, 149, 182, 0.25)', // Fallback default matching the previous gradient
  ...rest
}) => {
  return (
    <div className="relative w-full h-full pointer-events-none" {...rest}>
      <div 
        className="absolute inset-0 w-full h-full opacity-60"
        style={{
          backgroundImage: `radial-gradient(${dotColor} ${dotRadius}px, transparent ${dotRadius}px)`,
          backgroundSize: `${dotSpacing}px ${dotSpacing}px`,
          backgroundPosition: 'center center'
        }}
      />
    </div>
  );
});

DotField.displayName = 'DotField';

export default DotField;
