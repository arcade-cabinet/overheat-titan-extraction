const fs = require('fs');

function replaceFile(path, from, to) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(from, to);
  fs.writeFileSync(path, content);
}

replaceFile('src/components/UpgradeConsole.tsx', 'const level = upgrades[u.key]', 'const level = upgrades[u.key as keyof typeof upgrades]');
replaceFile('src/components/UpgradeConsole.tsx', 'const level = upgrades[u.key]', 'const level = upgrades[u.key as keyof typeof upgrades]');
replaceFile('src/components/UpgradeConsole.tsx', 'buyUpgrade(u.key, cost)', 'buyUpgrade(u.key as any, cost)');
replaceFile('src/components/UpgradeConsole.tsx', 'function handlePointerDown(event) {', 'function handlePointerDown(event: any) {');

replaceFile('src/components/UpgradesTerminal.tsx', 'const level = upgrades[u.key]', 'const level = upgrades[u.key as keyof typeof upgrades]');
replaceFile('src/components/UpgradesTerminal.tsx', 'buyUpgrade(u.key, cost)', 'buyUpgrade(u.key as any, cost)');

replaceFile('src/components/MobileControls.tsx', 'const handleTouchStart = (e, side) => {', 'const handleTouchStart = (e: any, side: any) => {');
replaceFile('src/components/MobileControls.tsx', 'const handleTouchMove = (e) => {', 'const handleTouchMove = (e: any) => {');
replaceFile('src/components/MobileControls.tsx', 'const handleTouchEnd = (e) => {', 'const handleTouchEnd = (e: any) => {');

replaceFile('src/components/Dashboard.tsx', 'function handlePointerDown(event) {', 'function handlePointerDown(event: any) {');
replaceFile('src/components/MainMenu.tsx', 'function btnStyle(color) {', 'function btnStyle(color: string) {');
replaceFile('src/components/PauseMenu.tsx', 'const onKey = (e) => {', 'const onKey = (e: KeyboardEvent) => {');
replaceFile('src/components/Silo.tsx', 'const handleIntersect = (e) => {', 'const handleIntersect = (e: any) => {');
replaceFile('src/components/SettingsMenu.tsx', '<label style={labelStyle}>', '<label style={labelStyle as any}>');
replaceFile('src/components/SettingsMenu.tsx', '<label style={labelStyle}>', '<label style={labelStyle as any}>');

