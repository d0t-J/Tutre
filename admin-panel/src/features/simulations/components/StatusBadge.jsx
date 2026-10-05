import { STATUS_STYLES } from '../utils/simulationStatus';

// Review status of a simulation. Colour and text together, so the status never
// depends on colour alone.
export default function StatusBadge({ status, className = '' }) {
  const style = STATUS_STYLES[status];
  if (!style) return null;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] sm:text-xs font-bold whitespace-nowrap ${style.className} ${className}`}>
      {style.label}
    </span>
  );
}
