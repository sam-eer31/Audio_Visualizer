import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { COLOR_PRESETS } from '@/lib/constants'

export function FuturisticOrb() {
  const groupRef = useRef<THREE.Group>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const wireRef = useRef<THREE.Mesh>(null)
  const ring1Ref = useRef<THREE.Mesh>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)
  const ring3Ref = useRef<THREE.Mesh>(null)
  const particlesRef = useRef<THREE.Points>(null)

  const { getAnalysis } = useAudioAnalyzer()
  const colorPreset = useVisualizerStore((s) => s.colorPreset)
  const rotationSpeed = useVisualizerStore((s) => s.rotationSpeed)
  const glowIntensity = 0.2

  const colors = useMemo(() => {
    const preset = COLOR_PRESETS.find((p) => p.id === colorPreset) || COLOR_PRESETS[0]
    return preset.colors.map((c) => new THREE.Color(c))
  }, [colorPreset])

  // Orbital particles
  const particleData = useMemo(() => {
    const count = 600
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 2.8 + Math.random() * 1.2
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
    }
    return { positions, count }
  }, [])

  // Smooth values for lerping
  const smoothBass = useRef(0)
  const smoothMid = useRef(0)
  const smoothTreble = useRef(0)

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const analysis = getAnalysis()
    const t = state.clock.elapsedTime

    // Smooth audio values to prevent jitter
    smoothBass.current += (analysis.bass - smoothBass.current) * 0.12
    smoothMid.current += (analysis.mid - smoothMid.current) * 0.1
    smoothTreble.current += (analysis.treble - smoothTreble.current) * 0.08

    const bass = smoothBass.current
    const mid = smoothMid.current
    const treble = smoothTreble.current

    // Slow group rotation
    groupRef.current.rotation.y += delta * rotationSpeed * 0.2

    // Core sphere: warp along X, Y, Z axes independently for organic deformation
    if (coreRef.current) {
      const scaleX = 1.0 + bass * 0.45 + Math.sin(t * 4.5) * 0.12 * treble
      const scaleY = 1.0 + mid * 0.45 + Math.cos(t * 3.8) * 0.12 * bass
      const scaleZ = 1.0 + treble * 0.45 + Math.sin(t * 5.2) * 0.12 * mid
      coreRef.current.scale.set(scaleX, scaleY, scaleZ)

      const mat = coreRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = glowIntensity * 1.5 + bass * 4.5
    }

    // Glow shell: pulses and warps slightly outer, showing shell volume
    if (glowRef.current) {
      const scaleX = 1.06 + bass * 0.52 + Math.sin(t * 3.5) * 0.15
      const scaleY = 1.06 + mid * 0.52 + Math.cos(t * 4.2) * 0.15
      const scaleZ = 1.06 + treble * 0.52 + Math.sin(t * 2.8) * 0.15
      glowRef.current.scale.set(scaleX, scaleY, scaleZ)

      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.opacity = 0.05 + bass * 0.28 + mid * 0.12
      mat.emissiveIntensity = glowIntensity * 2.0 + bass * 5.0
    }

    // Wireframe shell: complex spin, scales with mids
    if (wireRef.current) {
      wireRef.current.rotation.x += delta * (0.3 + mid * 1.2)
      wireRef.current.rotation.y -= delta * (0.25 + bass * 0.8)
      wireRef.current.rotation.z += delta * (0.15 + treble * 1.5)

      const scaleX = 1.15 + mid * 0.45 + Math.sin(t * 6.0) * 0.05
      const scaleY = 1.15 + treble * 0.45 + Math.cos(t * 5.0) * 0.05
      const scaleZ = 1.15 + bass * 0.45 + Math.sin(t * 4.0) * 0.05
      wireRef.current.scale.set(scaleX, scaleY, scaleZ)

      const mat = wireRef.current.material as THREE.MeshStandardMaterial
      mat.opacity = 0.1 + mid * 0.45
      mat.emissiveIntensity = glowIntensity + mid * 3.5
    }

    // Ring 1: horizontal orbit base, precesses/wobbles on multiple axes
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += delta * (0.3 + bass * 1.8)
      ring1Ref.current.rotation.y += delta * (0.2 + mid * 0.8)
      const ringScale = 1.0 + bass * 0.35
      ring1Ref.current.scale.setScalar(ringScale)
      const mat = ring1Ref.current.material as THREE.MeshStandardMaterial
      mat.opacity = 0.2 + bass * 0.5
      mat.emissiveIntensity = glowIntensity * 1.5 + bass * 4.0
    }

    // Ring 2: tilted orbit base, spins dynamically
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y -= delta * (0.25 + mid * 1.6)
      ring2Ref.current.rotation.z += delta * (0.15 + treble * 1.0)
      const ringScale = 1.0 + mid * 0.3
      ring2Ref.current.scale.setScalar(ringScale)
      const mat = ring2Ref.current.material as THREE.MeshStandardMaterial
      mat.opacity = 0.15 + mid * 0.45
      mat.emissiveIntensity = glowIntensity * 1.2 + mid * 3.5
    }

    // Ring 3: vertical orbit base, reacts to high-frequency sparks
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x -= delta * (0.2 + treble * 2.2)
      ring3Ref.current.rotation.z -= delta * (0.3 + bass * 1.0)
      const ringScale = 1.0 + treble * 0.4
      ring3Ref.current.scale.setScalar(ringScale)
      const mat = ring3Ref.current.material as THREE.MeshStandardMaterial
      mat.opacity = 0.1 + treble * 0.5
      mat.emissiveIntensity = glowIntensity + treble * 4.5
    }

    // Particles: chaotic orbital swirl reacting strongly to all frequency bands
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * (0.15 + treble * 2.0)
      particlesRef.current.rotation.x += delta * (0.08 + mid * 1.0)
      particlesRef.current.rotation.z -= delta * (0.05 + bass * 0.5)

      const pScale = 1.0 + bass * 0.3 + mid * 0.2
      particlesRef.current.scale.setScalar(pScale)
      const mat = particlesRef.current.material as THREE.PointsMaterial
      mat.size = 0.035 + treble * 0.085
      mat.opacity = 0.3 + mid * 0.55
    }
  })

  return (
    <group ref={groupRef}>
      {/* Core solid sphere */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1.6, 4]} />
        <meshStandardMaterial
          color={colors[0]}
          emissive={colors[0]}
          emissiveIntensity={glowIntensity * 1.5}
          toneMapped={false}
        />
      </mesh>

      {/* Glow shell */}
      <mesh ref={glowRef}>
        <icosahedronGeometry args={[1.7, 4]} />
        <meshStandardMaterial
          color={colors[1]}
          emissive={colors[1]}
          emissiveIntensity={glowIntensity * 2}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
          toneMapped={false}
        />
      </mesh>

      {/* Wireframe shell */}
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[1.9, 2]} />
        <meshStandardMaterial
          color={colors[2]}
          emissive={colors[2]}
          emissiveIntensity={glowIntensity}
          wireframe
          transparent
          opacity={0.2}
          toneMapped={false}
        />
      </mesh>

      {/* Ring 1 - horizontal */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.5, 0.02, 16, 100]} />
        <meshStandardMaterial
          color={colors[0]}
          emissive={colors[0]}
          emissiveIntensity={glowIntensity * 1.5}
          transparent
          opacity={0.3}
          toneMapped={false}
        />
      </mesh>

      {/* Ring 2 - tilted */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[2.8, 0.015, 16, 100]} />
        <meshStandardMaterial
          color={colors[1]}
          emissive={colors[1]}
          emissiveIntensity={glowIntensity * 1.2}
          transparent
          opacity={0.25}
          toneMapped={false}
        />
      </mesh>

      {/* Ring 3 - vertical */}
      <mesh ref={ring3Ref} rotation={[0, 0, Math.PI / 6]}>
        <torusGeometry args={[3.0, 0.012, 16, 100]} />
        <meshStandardMaterial
          color={colors[2]}
          emissive={colors[2]}
          emissiveIntensity={glowIntensity}
          transparent
          opacity={0.2}
          toneMapped={false}
        />
      </mesh>

      {/* Orbital particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particleData.positions, 3]}
            count={particleData.count}
          />
        </bufferGeometry>
        <pointsMaterial
          color={colors[1]}
          size={0.05}
          transparent
          opacity={0.5}
          sizeAttenuation
          toneMapped={false}
        />
      </points>
    </group>
  )
}
