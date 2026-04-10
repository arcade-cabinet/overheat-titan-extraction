const fs = require('fs');
let data = fs.readFileSync('docs/HANDOFF.md', 'utf8');

data = data.replace(
  '| Diegetic upgrade console (3D terminal, UV raycast, range gate) | ✅ Complete |',
  `| Diegetic upgrade console (3D terminal, UV raycast, range gate) | ✅ Complete |
| Meltdown radial impulse (rigid body explosion) | ✅ Complete |
| **M3: Mobile Controls / InputService** | ✅ Complete |
| **M3: Virtual Joystick / Touch action UI** | ✅ Complete |
| **M3: Haptic Feedback / Aim Assist** | ✅ Complete |
| **M3: Landscape Lock / Safe Area** | ✅ Complete |`
);

data = data.replace(
  'All outstanding priorities (Diegetic Upgrade Menu, Meltdown Radial Impulse, Dashboard UV calibration, and Ore Grind physics contact) have been addressed and shipped.\n\nThe project is currently stable. Any future tasks will be driven by new feature requests or architectural changes.',
  `All M1, M2, and M3 (Mobile / Capacitor) priorities are fully completed and shipped. 

The project has entered M4 (Visual / Audio Polish) and M5 (Content / Progression).

Next logical steps for **M4**:
1. Final cockpit dashboard art pass
2. Ore shrink animation via react-spring
3. AudioEngine mixing pass

Next logical steps for **M5**:
1. Contracts / timed objectives
2. Additional ore variety
3. Environmental variation`
);

fs.writeFileSync('docs/HANDOFF.md', data);
