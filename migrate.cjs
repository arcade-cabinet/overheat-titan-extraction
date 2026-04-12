const fs = require('fs');

const files = [
  'src/components/AmbientSpores.tsx',
  'src/components/BootScreen.tsx',
  'src/components/Headlamp.tsx',
  'src/components/MeltdownExplosion.tsx',
  'src/components/MoltenSaw.tsx',
  'src/components/Sparks.tsx',
  'src/components/TractorBeam.tsx',
  'src/components/VisualEffects.tsx',
  'src/components/Silo.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/import \{ useGameStore \} from '\.\.\/store'/g, 
    `import { useTrait } from 'koota/react'\nimport { GameStateEntity } from '../ecs/world'\nimport { GlobalState, Heat, Hopper, Contracts, Upgrades } from '../ecs/traits'\nimport { gameActions, gameSelectors } from '../ecs/actions'`);
  
  content = content.replace(/const phase = useGameStore\(\(s\) => s\.phase\)/g, 'const phase = useTrait(GameStateEntity, GlobalState)?.phase');
  content = content.replace(/const isPaused = useGameStore\(\(s\) => s\.isPaused\)/g, 'const isPaused = useTrait(GameStateEntity, GlobalState)?.isPaused');
  content = content.replace(/const isMelting = useGameStore\(\(s\) => s\.isMelting\)/g, 'const isMelting = useTrait(GameStateEntity, Heat)?.melting');
  content = content.replace(/const heat = useGameStore\(\(s\) => s\.heat\)/g, 'const heat = useTrait(GameStateEntity, Heat)?.value ?? 0');
  content = content.replace(/const isOverheated = useGameStore\(\(s\) => s\.isOverheated\)/g, 'const isOverheated = useTrait(GameStateEntity, Heat)?.overheated');
  content = content.replace(/const crtOverlays = useGameStore\(\(s\) => s\.settings\.crtOverlays\)/g, 'const crtOverlays = useTrait(GameStateEntity, GlobalState)?.crtOverlays');
  
  content = content.replace(/const setPhase = useGameStore\(\(s\) => s\.setPhase\)/g, 'const setPhase = gameActions.setPhase');
  content = content.replace(/const addCredits = useGameStore\(\(s\) => s\.addCredits\)/g, 'const addCredits = gameActions.addCredits');
  
  // Cleanup unused imports if needed but biome does that mostly
  fs.writeFileSync(f, content);
});
