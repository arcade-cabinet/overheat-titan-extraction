import { Dashboard } from './Dashboard'
import { Headlamp } from './Headlamp'
import { MoltenSaw } from './MoltenSaw'
import { TractorBeam } from './TractorBeam'

export function Cockpit() {
  return (
    <group>
      <Dashboard />
      <MoltenSaw />
      <Headlamp />
      <TractorBeam />
      {/* Crosshair dot */}
      <mesh position={[0, 0, -2]}>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshBasicMaterial color="#00ffcc" />
      </mesh>
    </group>
  )
}
