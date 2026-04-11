const fs = require('fs');

const files = [
  'src/components/AmbientSpores.tsx',
  'src/components/BootScreen.tsx',
  'src/components/Headlamp.tsx',
  'src/components/MainMenu.tsx',
  'src/components/MeltdownExplosion.tsx',
  'src/components/MeltdownScreen.tsx',
  'src/components/MoltenSaw.tsx',
  'src/components/OreSpawner.tsx',
  'src/components/PauseMenu.tsx',
  'src/components/Player.tsx',
  'src/components/SettingsMenu.tsx',
  'src/components/Silo.tsx',
  'src/components/Sparks.tsx',
  'src/components/TractorBeam.tsx',
  'src/components/UpgradesTerminal.tsx',
  'src/components/VisualEffects.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/import \{.*?gameSelectors.*?\} from '\.\.\/ecs\/actions'\n/g, "import { gameActions } from '../ecs/actions'\n");
  content = content.replace(/import \{ gameActions, gameSelectors \} from '\.\.\/ecs\/actions'\n/g, "import { gameActions } from '../ecs/actions'\n");
  content = content.replace(/import \{ gameActions \} from '\.\.\/ecs\/actions'\n/g, ""); // strip completely if unused? No, let biome do it.
  
  content = content.replace(/import type \{ ContractType \} from '\.\.\/store'\n/g, "");

  fs.writeFileSync(f, content);
});
