import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { COLOR_PRESETS } from '@/lib/constants'

const PARTICLE_COUNT = 3500
const EVENT_HORIZON_RADIUS = 1.1

interface ParticleState {
  angle: number
  radius: number
  orbitSpeed: number
  colorIndex: number
  zOffset: number
  lensedSign: number
}

export function AudioPortal() {
  const pointsRef = useRef<THREE.Points>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const horizontalRingRef = useRef<THREE.Mesh>(null)
  const verticalRingRef = useRef<THREE.Mesh>(null)
  const { getAnalysis } = useAudioAnalyzer()
  const colorPreset = useVisualizerStore((s) => s.colorPreset)
  const glowIntensity = 0.2

  const colors = useMemo(() => {
    const preset = COLOR_PRESETS.find((p) => p.id === colorPreset) || COLOR_PRESETS[0]
    return preset.colors.map((c) => new THREE.Color(c))
  }, [colorPreset])

  // Instantiate particle state data
  const particles = useMemo<ParticleState[]>(() => {
    const list: ParticleState[] = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = 1.3 + Math.random() * 5.0
      // Orbital speed: faster closer to center, slower further away
      const speed = (0.5 + Math.random() * 0.5) / Math.sqrt(radius)
      
      list.push({
        angle: Math.random() * Math.PI * 2,
        radius: radius,
        orbitSpeed: speed,
        colorIndex: i % colors.length,
        zOffset: (Math.random() - 0.5) * 0.1,
        lensedSign: Math.random() > 0.5 ? 1 : -1,
      })
    }
    return list
  }, [colors.length])

  // Flat arrays for buffer geometry attributes
  const { initialPositions, initialColors } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3)
    const cols = new Float32Array(PARTICLE_COUNT * 3)
    return { initialPositions: pos, initialColors: cols }
  }, [])

  useFrame((state, delta) => {
    if (!pointsRef.current || !coreRef.current || !horizontalRingRef.current || !verticalRingRef.current) return
    const analysis = getAnalysis()
    const bass = analysis.bass
    const mid = analysis.mid
    const treble = analysis.treble
    const time = state.clock.elapsedTime

    // Event Horizon core pulse: scale with bass
    const coreScale = 1.0 + bass * 0.22
    coreRef.current.scale.setScalar(coreScale)

    // Outer accretion boundary rings pulse
    const ringScale = 1.08 + bass * 0.28
    horizontalRingRef.current.scale.setScalar(ringScale)
    verticalRingRef.current.scale.setScalar(ringScale)

    const hRingMat = horizontalRingRef.current.material as THREE.MeshStandardMaterial
    const vRingMat = verticalRingRef.current.material as THREE.MeshStandardMaterial
    const targetEmissive = glowIntensity * 3 + bass * 2.5
    hRingMat.emissiveIntensity = targetEmissive
    vRingMat.emissiveIntensity = targetEmissive

    // Swirl and pull particles
    const geom = pointsRef.current.geometry
    const posAttr = geom.attributes.position as THREE.BufferAttribute
    const colAttr = geom.attributes.color as THREE.BufferAttribute
    const posArr = posAttr.array as Float32Array
    const colArr = colAttr.array as Float32Array

    // Particle movement speed multipliers reacting to audio energy
    const rotationMult = 1.0 + bass * 1.5 + mid * 0.8
    const pullSpeedMult = 1.0 + mid * 1.5

    particles.forEach((p, i) => {
      // Rotate around the center
      p.angle += p.orbitSpeed * rotationMult * delta

      // Pull inward gravitationally
      p.radius -= 0.15 * pullSpeedMult * delta

      // Swallowed by black hole: reset to the outer boundary
      if (p.radius <= EVENT_HORIZON_RADIUS) {
        p.radius = 5.5 + Math.random() * 1.5
        p.angle = Math.random() * Math.PI * 2
      }

      // Add dynamic radial vibration on treble/highs
      const jitterRadius = p.radius + Math.sin(time * 15 + p.radius * 8) * treble * 0.15
      
      // Normalize angle to [0, 2PI] for mapping
      let angle = p.angle % (Math.PI * 2)
      if (angle < 0) angle += Math.PI * 2

      // Front vs Back mapping for gravitational lensing
      const isFront = angle >= 0 && angle < Math.PI

      let x = 0
      let y = 0
      let z = 0

      if (isFront) {
        // Front half: standard flat disk in horizontal X-Z plane, passing in front
        x = Math.cos(angle) * jitterRadius
        y = p.zOffset * 0.6 // minor vertical thickness
        z = Math.sin(angle) * jitterRadius
      } else {
        // Back half: lensed vertical arches in X-Y plane (above/below event horizon)
        x = Math.cos(angle) * jitterRadius
        y = p.lensedSign * Math.sin(angle) * jitterRadius
        z = Math.sin(angle) * jitterRadius * 0.08 + p.zOffset
      }

      const i3 = i * 3
      posArr[i3] = x
      posArr[i3 + 1] = y
      posArr[i3 + 2] = z

      // Color mapping: hotter/brighter near center
      const proximity = Math.max(0, Math.min((p.radius - EVENT_HORIZON_RADIUS) / 5.0, 1))
      // Base particle color from preset
      const baseColor = colors[p.colorIndex].clone()
      // Hot white glow blend for inner disk particles
      const col = new THREE.Color(1, 1, 1).lerp(baseColor, Math.sqrt(proximity))

      colArr[i3] = col.r
      colArr[i3 + 1] = col.g
      colArr[i3 + 2] = col.b
    })

    posAttr.needsUpdate = true
    colAttr.needsUpdate = true

    // Adjust particle rendering points Material based on audio highs
    const pMat = pointsRef.current.material as THREE.PointsMaterial
    pMat.size = 0.03 + treble * 0.03
  })

  return (
    <group>
      {/* Central Black Hole Core (Event Horizon) */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[EVENT_HORIZON_RADIUS, 32, 32]} />
        <meshBasicMaterial color="#020205" />
      </mesh>

      {/* Horizontal Accretion Boundary Glowing Ring (X-Z plane) */}
      <mesh ref={horizontalRingRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[EVENT_HORIZON_RADIUS + 0.05, 0.03, 8, 64]} />
        <meshStandardMaterial
          color={colors[0]}
          emissive={colors[0]}
          emissiveIntensity={glowIntensity * 2.5}
          toneMapped={false}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Vertical Lensed Accretion Boundary Glowing Ring (X-Y plane) */}
      <mesh ref={verticalRingRef} rotation={[0, 0, 0]}>
        <torusGeometry args={[EVENT_HORIZON_RADIUS + 0.05, 0.03, 8, 64]} />
        <meshStandardMaterial
          color={colors[0]}
          emissive={colors[0]}
          emissiveIntensity={glowIntensity * 2.5}
          toneMapped={false}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Swirling Accretion Disk Particles */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[initialPositions, 3]} count={PARTICLE_COUNT} />
          <bufferAttribute attach="attributes-color" args={[initialColors, 3]} count={PARTICLE_COUNT} />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          transparent
          opacity={0.8}
          sizeAttenuation
          vertexColors
          toneMapped={false}
        />
      </points>
    </group>
  )
}
