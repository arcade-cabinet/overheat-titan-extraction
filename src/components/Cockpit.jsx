import { Dashboard } from './Dashboard'
import { MoltenSaw } from './MoltenSaw'

export function Cockpit() {
  return (
    <group>
      <Dashboard />
      <MoltenSaw />
      {/* Crosshair dot */}
      <mesh position={[0, 0, -2]}>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshBasicMaterial color="#00ffcc" />
      </mesh>
    </group>
  )
}
