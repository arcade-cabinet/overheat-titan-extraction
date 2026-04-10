const fs = require('fs');
let code = fs.readFileSync('src/components/VisualEffects.tsx', 'utf8');
code = code.replace(
  '{isPaused && <HueSaturation saturation={-1.0} blendFunction={BlendFunction.NORMAL} />}',
  '{isPaused ? <HueSaturation saturation={-1.0} blendFunction={BlendFunction.NORMAL} /> : null}'
);
code = code.replace(
  '{isMelting && (\n        <Glitch\n          delay={new THREE.Vector2(0.0, 0.08) as any}\n          duration={new THREE.Vector2(0.1, 0.3) as any}\n          strength={new THREE.Vector2(0.3, 1.0) as any}\n          mode={GlitchMode.CONSTANT_WILD}\n          blendFunction={BlendFunction.NORMAL}\n        />\n      )}',
  '{isMelting ? (\n        <Glitch\n          delay={new THREE.Vector2(0.0, 0.08) as any}\n          duration={new THREE.Vector2(0.1, 0.3) as any}\n          strength={new THREE.Vector2(0.3, 1.0) as any}\n          mode={GlitchMode.CONSTANT_WILD}\n          blendFunction={BlendFunction.NORMAL}\n        />\n      ) : null}'
);
code = code.replace(
  '{crtOverlays && <CRTEffect />}',
  '{crtOverlays ? <CRTEffect /> : null}'
);
fs.writeFileSync('src/components/VisualEffects.tsx', code);
