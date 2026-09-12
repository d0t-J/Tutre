import * as Icons from 'lucide-react';

const CHAPTER_ICON_PALETTE = [
  'Hexagon', 'Box', 'Layers', 'Compass', 'Component', 'Sparkles', 
  'Boxes', 'CircleDashed', 'Pyramid', 'Library', 'Zap', 'Activity', 
  'Star', 'Telescope', 'Cpu', 'Lightbulb', 'Mountain', 'Target', 'Radar'
];

const KEYWORD_MAPPINGS = {
  // --- MATHEMATICS ---
  algebra: 'Variable', geometry: 'Shapes', calculus: 'Activity', trig: 'Triangle', trigonometry: 'Triangle',
  fraction: 'Divide', probab: 'Dices', stat: 'BarChart', matrix: 'Grid', vector: 'MoveUpRight',
  equation: 'Calculator', deriv: 'TrendingUp', integral: 'Activity', number: 'Hash', arithmetic: 'PlusSquare',
  math: 'Calculator', measure: 'Ruler', angle: 'DraftingCompass', polygon: 'Hexagon', theorem: 'ScrollText',

  // --- PHYSICS ---
  force: 'Move', motion: 'Activity', kinematic: 'Activity', dynamic: 'Activity', 
  wave: 'Waves', sound: 'Volume2', light: 'Sun', optic: 'Eye',
  electric: 'Zap', circuit: 'Cpu', current: 'Zap', magnet: 'Magnet', 
  gravity: 'ArrowDown', heat: 'Flame', thermo: 'Thermometer', quantum: 'Atom',
  relativity: 'Orbit', mechanic: 'Settings', work: 'Briefcase', power: 'Zap',
  
  // --- CHEMISTRY ---
  atom: 'Atom', nuclear: 'Atom', particle: 'Atom', electron: 'Atom', proton: 'Atom', neutron: 'Atom',
  matter: 'Box', solid: 'Box', liquid: 'Droplets', gas: 'Wind', phase: 'Layers',
  chemical: 'Hexagon', bond: 'Component', reaction: 'FlaskConical', compound: 'Hexagon', molecule: 'Hexagon',
  stoichiometry: 'Calculator', equilibrium: 'Scale', equilibria: 'Scale', balance: 'Scale',
  acid: 'FlaskConical', base: 'Beaker', ph: 'Beaker',
  periodic: 'Grid', element: 'TableProperties', table: 'TableProperties', group: 'Users',
  hydrocarbon: 'Hexagon', organic: 'Hexagon', carbon: 'Hexagon', polymer: 'Boxes', kinetic: 'Activity',
  
  // --- BIOLOGY / SCIENCE ---
  cell: 'Box', biology: 'Dna', life: 'Heart', genetic: 'Dna', dna: 'Dna', 
  environment: 'Globe', nature: 'Leaf', earth: 'Globe', eco: 'Leaf',
  plant: 'Sprout', animal: 'Bug', human: 'User', anatomy: 'Bone', 
  virus: 'Bug', bacteria: 'Bug', ecosystem: 'Globe', evolution: 'TrendingUp',
  
  // --- COMPUTER SCIENCE / IT ---
  computer: 'Monitor', program: 'Code', code: 'Code', software: 'Terminal', hardware: 'Cpu',
  network: 'Network', internet: 'Globe', data: 'Database', algorithm: 'Binary',
  system: 'Server', security: 'Shield', web: 'Layout', ai: 'Bot',
  
  // --- ENGLISH / LITERATURE ---
  grammar: 'SpellCheck', writ: 'PenTool', read: 'BookOpen', literature: 'Library', 
  poem: 'Feather', poetry: 'Feather', essay: 'FileText', language: 'Languages',
  vocab: 'BookA', speech: 'Mic', text: 'FileText',

  // --- HISTORY / GEOGRAPHY / SOCIAL ---
  history: 'Hourglass', ancient: 'Landmark', world: 'Globe', geography: 'Map',
  map: 'Map', country: 'Flag', civilization: 'Castle', society: 'Users',
  
  // --- MUSIC / ART ---
  music: 'Music', art: 'Palette', draw: 'PenTool', paint: 'Brush', color: 'Palette',
  audio: 'Headphones', instrument: 'Music', piano: 'Music', 
  guitar: 'Music', sing: 'Mic', song: 'Music', melody: 'Music', harmony: 'Music',

  // --- SPORTS / PHYSICAL EDUCATION ---
  sport: 'Trophy', physical: 'Activity', exercise: 'Dumbbell', health: 'HeartPulse',
  fitness: 'Activity', run: 'Activity', ball: 'Circle', game: 'Gamepad2', team: 'Users',

  // --- ECONOMICS / BUSINESS / FINANCE ---
  economic: 'TrendingUp', business: 'Briefcase', finance: 'Banknote', money: 'Coins',
  trade: 'HandCoins', market: 'LineChart', stock: 'TrendingUp', invest: 'PieChart',
  bank: 'Building', economy: 'Globe', account: 'Calculator', management: 'Users',
  marketing: 'Megaphone', strategy: 'Target',

  // --- ASTRONOMY / SPACE ---
  astronomy: 'Telescope', space: 'Rocket', star: 'Star', planet: 'Globe', 
  galaxy: 'Star', universe: 'Globe', moon: 'Moon', solar: 'Sun',

  // --- PSYCHOLOGY / SOCIOLOGY ---
  psychology: 'BrainCircuit', mind: 'BrainCircuit', brain: 'BrainCircuit', 
  sociology: 'Users', behavior: 'Activity', emotion: 'Heart', culture: 'Globe',

  // --- GENERAL / LAB / ANALYSIS ---
  empirical: 'BarChart', analysis: 'LineChart', graph: 'LineChart',
  lab: 'Microscope', laboratory: 'Microscope', practical: 'TestTube', 
  skill: 'Wrench', technique: 'Wrench', experiment: 'FlaskConical',
  intro: 'Play', basic: 'CornerDownRight', advanced: 'ChevronsUp',
  summary: 'List', review: 'CheckCircle'
};

/**
 * Returns a semantic icon based on the chapter name, 
 * falling back to an index-based or deterministic icon.
 */
export const getDeterministicIcon = (id, name = '', index = -1) => {
  if (name) {
    const lowerName = name.toLowerCase();
    // Check for keyword matches in the chapter name
    for (const [keyword, iconName] of Object.entries(KEYWORD_MAPPINGS)) {
      // Use boundary at the start to match plurals (e.g. \bacid matches acids)
      if (new RegExp(`\\b${keyword}`, 'i').test(lowerName) && Icons[iconName]) {
        return Icons[iconName];
      }
    }
  }

  // Fallback to index if provided to guarantee no duplicates in short lists
  if (index >= 0) {
    const iconName = CHAPTER_ICON_PALETTE[index % CHAPTER_ICON_PALETTE.length];
    return Icons[iconName] || Icons.Layers;
  }

  if (!id) return Icons.Layers;
  
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hashIndex = Math.abs(hash) % CHAPTER_ICON_PALETTE.length;
  const iconName = CHAPTER_ICON_PALETTE[hashIndex];
  
  return Icons[iconName] || Icons.Layers;
};
