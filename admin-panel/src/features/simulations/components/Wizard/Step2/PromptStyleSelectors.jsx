import { useWizard } from '../../../context/WizardContext';
import { Palette, Cuboid, Pointer, Atom, LineChart, CircuitBoard, LayoutTemplate } from 'lucide-react';

export default function PromptStyleSelectors() {
  const { 
    uiTheme, setUiTheme,
    animationArchitecture, setAnimationArchitecture,
    interactionType, setInteractionType
  } = useWizard();

  const architectures = [
    { id: 'physics', label: 'Physical World', icon: <Atom className="w-5 h-5 text-indigo-500" />, desc: 'Realistic movement, gravity, and collisions' },
    { id: 'math', label: 'Charts & Graphs', icon: <LineChart className="w-5 h-5 text-blue-500" />, desc: 'Data plotting, axes, and math curves' },
    { id: 'node', label: 'Boards & Circuits', icon: <CircuitBoard className="w-5 h-5 text-orange-500" />, desc: 'Draggable items connecting on a grid' },
    { id: 'dom', label: 'Interactive UI', icon: <LayoutTemplate className="w-5 h-5 text-pink-500" />, desc: 'Clean presentation with dynamic elements' }
  ];

  const themes = [
    { id: 'modern', label: 'Scientific / Modern', desc: 'Clean, professional, and easily readable' },
    { id: 'playful', label: 'Playful / Primary', desc: 'Bright colors and kid-friendly design' },
    { id: 'dark', label: 'Dark Mode', desc: 'Deep backgrounds with glowing accents' },
    { id: 'contrast', label: 'High Contrast', desc: 'Maximum readability and accessibility' }
  ];

  const interactions = [
    { id: 'slider', label: 'Sliders & Inputs', desc: 'Control panel with adjustable numbers' },
    { id: 'drag', label: 'Drag & Drop', desc: 'Physically move objects around the screen' },
    { id: 'click', label: 'Click & Reveal', desc: 'Step-by-step interactive walkthroughs' }
  ];

  return (
    <div className="w-full lg:w-[45%] flex flex-col gap-5 lg:overflow-y-auto pr-2 pl-1 py-1 lg:-ml-1 lg:-my-1 custom-scrollbar shrink-0">
      
      {/* Compartment 1: Architecture */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <Cuboid className="w-4 h-4 text-primary-500" />
          Environment Style
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {architectures.map(arc => (
            <button
              key={arc.id}
              onClick={() => setAnimationArchitecture(arc.id)}
              className={`flex items-start gap-2.5 p-2 rounded-lg border text-left transition-all ${animationArchitecture === arc.id ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
            >
              <div className="shrink-0 mt-0.5">{arc.icon}</div>
              <div className="flex flex-col">
                <div className={`text-xs font-bold ${animationArchitecture === arc.id ? 'text-primary-700' : 'text-slate-700'}`}>{arc.label}</div>
                <div className="text-[10px] text-slate-500 leading-tight">{arc.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Compartment 2: Theme */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <Palette className="w-4 h-4 text-emerald-500" />
          Visual Theme
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {themes.map(th => (
            <button
              key={th.id}
              onClick={() => setUiTheme(th.id)}
              className={`p-2 rounded-lg border text-left transition-all ${uiTheme === th.id ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
            >
              <div className={`text-xs font-bold ${uiTheme === th.id ? 'text-primary-700' : 'text-slate-700'}`}>{th.label}</div>
              <div className="text-[10px] text-slate-500 truncate">{th.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Compartment 3: Interaction */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <Pointer className="w-4 h-4 text-amber-500" />
          Interaction Style
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {interactions.map(int => (
            <button
              key={int.id}
              onClick={() => setInteractionType(int.id)}
              className={`py-1.5 px-1.5 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${interactionType === int.id ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
            >
              <div className={`text-xs font-bold ${interactionType === int.id ? 'text-primary-700' : 'text-slate-700'} leading-tight`}>{int.label}</div>
              <div className="text-[9px] text-slate-500 leading-tight px-1">{int.desc}</div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
