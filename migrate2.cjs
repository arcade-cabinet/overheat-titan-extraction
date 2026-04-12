const fs = require('fs');

const files = [
  'src/components/PauseMenu.tsx',
  'src/components/Player.tsx',
  'src/components/SettingsMenu.tsx',
  'src/components/OreSpawner.tsx',
  'src/components/MeltdownScreen.tsx',
  'src/components/MainMenu.tsx',
  'src/components/UpgradesTerminal.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/import \{ useGameStore(\, [^\}]+)? \} from '\.\.\/store'/g, 
    `import { useTrait } from 'koota/react'\nimport { GameStateEntity } from '../ecs/world'\nimport { GlobalState, Heat, Hopper, Contracts, Upgrades } from '../ecs/traits'\nimport { gameActions, gameSelectors$1 } from '../ecs/actions'\nimport type { ContractType } from '../store'`);
  
  content = content.replace(/const phase = useGameStore\(\(s\) => s\.phase\)/g, 'const phase = useTrait(GameStateEntity, GlobalState)?.phase');
  content = content.replace(/const isPaused = useGameStore\(\(s\) => s\.isPaused\)/g, 'const isPaused = useTrait(GameStateEntity, GlobalState)?.isPaused');
  content = content.replace(/const isMelting = useGameStore\(\(s\) => s\.isMelting\)/g, 'const isMelting = useTrait(GameStateEntity, Heat)?.melting');
  content = content.replace(/const isOverheated = useGameStore\(\(s\) => s\.isOverheated\)/g, 'const isOverheated = useTrait(GameStateEntity, Heat)?.overheated');
  content = content.replace(/const heat = useGameStore\(\(s\) => s\.heat\)/g, 'const heat = useTrait(GameStateEntity, Heat)?.value ?? 0');
  content = content.replace(/const rawOre = useGameStore\(\(s\) => s\.rawOre\)/g, 'const rawOre = useTrait(GameStateEntity, Hopper)?.current ?? 0');
  content = content.replace(/const credits = useGameStore\(\(s\) => s\.credits\)/g, 'const credits = useTrait(GameStateEntity, GlobalState)?.credits ?? 0');
  content = content.replace(/const sessionCredits = useGameStore\(\(s\) => s\.sessionCredits\)/g, 'const sessionCredits = useTrait(GameStateEntity, GlobalState)?.sessionCredits ?? 0');
  
  content = content.replace(/const activeContract = useGameStore\(\(s\) => s\.activeContract\)/g, 'const activeContract = useTrait(GameStateEntity, Contracts)?.activeContract');
  content = content.replace(/const contractStatus = useGameStore\(\(s\) => s\.contractStatus\)/g, 'const contractStatus = useTrait(GameStateEntity, Contracts)?.contractStatus');
  content = content.replace(/const upgrades = useGameStore\(\(s\) => s\.upgrades\)/g, 'const upgrades = useTrait(GameStateEntity, Upgrades)');
  content = content.replace(/const settings = useGameStore\(\(s\) => s\.settings\)/g, 'const settings = useTrait(GameStateEntity, GlobalState)');
  content = content.replace(/const lookSensitivity = useGameStore\(\(s\) => s\.settings\.lookSensitivity\)/g, 'const lookSensitivity = useTrait(GameStateEntity, GlobalState)?.lookSensitivity ?? 1.0');
  
  content = content.replace(/const getMaxOre = useGameStore\(\(s\) => s\.getMaxOre\)/g, 'const getMaxOre = gameSelectors.getMaxOre');
  content = content.replace(/const getGrindDps = useGameStore\(\(s\) => s\.getGrindDps\)/g, 'const getGrindDps = gameSelectors.getGrindDps');
  content = content.replace(/const getCoolingRate = useGameStore\(\(s\) => s\.getCoolingRate\)/g, 'const getCoolingRate = gameSelectors.getCoolingRate');

  content = content.replace(/const setPhase = useGameStore\(\(s\) => s\.setPhase\)/g, 'const setPhase = gameActions.setPhase');
  content = content.replace(/const setPaused = useGameStore\(\(s\) => s\.setPaused\)/g, 'const setPaused = gameActions.setPaused');
  content = content.replace(/const addOre = useGameStore\(\(s\) => s\.addOre\)/g, 'const addOre = gameActions.addOre');
  content = content.replace(/const addHeat = useGameStore\(\(s\) => s\.addHeat\)/g, 'const addHeat = gameActions.addHeat');
  content = content.replace(/const coolDown = useGameStore\(\(s\) => s\.coolDown\)/g, 'const coolDown = gameActions.coolDown');
  content = content.replace(/const ejectCube = useGameStore\(\(s\) => s\.ejectCube\)/g, 'const ejectCube = gameActions.ejectCube');
  content = content.replace(/const buyUpgrade = useGameStore\(\(s\) => s\.buyUpgrade\)/g, 'const buyUpgrade = gameActions.buyUpgrade');
  content = content.replace(/const updateSetting = useGameStore\(\(s\) => s\.updateSetting\)/g, 'const updateSetting = gameActions.updateSetting');
  content = content.replace(/const resetSession = useGameStore\(\(s\) => s\.resetSession\)/g, 'const resetSession = gameActions.resetSession');
  
  fs.writeFileSync(f, content);
});
