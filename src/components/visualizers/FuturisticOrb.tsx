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
  const glowIntensity = useVisualizerStore((s) => s.glowIntensity)

  const colors = useMemo(() => {
    const preset = COLOR_PRESETS.find((p) => p.id === colorPreset) || COLOR_PRESETS[0]
    return preset.colors.map((c) => new THREE.Color(c))
  }, [colorPreset])

  // Orbital particles
  const particleData = useMemo(() => {
    const count = 200
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 3.2 + Math.random() * 0.8
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

    // Core sphere: pulse with bass
    if (coreRef.current) {
      const coreScale = 1.0 + bass * 0.3 + Math.sin(t * 1.5) * 0.02
      coreRef.current.scale.setScalar(coreScale)
      const mat = coreRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = glowIntensity * 1.5 + bass * 2
    }

    // Glow shell: slightly larger, pulses opposite
    if (glowRef.current) {
      const glowScale = 1.05 + bass * 0.35 + Math.sin(t * 1.2) * 0.03
      glowRef.current.scale.setScalar(glowScale)
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.opacity = 0.08 + bass * 0.15 + mid * 0.05
      mat.emissiveIntensity = glowIntensity * 2 + bass * 3
    }

    // Wireframe shell: rotates independently, reacts to mid
    if (wireRef.current) {
      wireRef.current.rotation.x += delta * 0.15
      wireRef.current.rotation.z += delta * 0.1
      const wireScale = 1.15 + mid * 0.25
      wireRef.current.scale.setScalar(wireScale)
      const mat = wireRef.current.material as THREE.MeshStandardMaterial
      mat.opacity = 0.15 + mid * 0.3
      mat.emissiveIntensity = glowIntensity + mid * 2
    }

    // Ring 1: horizontal orbit, reacts to bass
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 0.6
      const ringScale = 1.0 + bass * 0.2
      ring1Ref.current.scale.setScalar(ringScale)
      const mat = ring1Ref.current.material as THREE.MeshStandardMaterial
      mat.opacity = 0.25 + bass * 0.4
      mat.emissiveIntensity = glowIntensity * 1.5 + bass * 2
    }

    // Ring 2: tilted orbit, reacts to mid
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= delta * 0.4
      const mat = ring2Ref.current.material as THREE.MeshStandardMaterial
      mat.opacity = 0.2 + mid * 0.35
      mat.emissiveIntensity = glowIntensity * 1.2 + mid * 2
    }

    // Ring 3: vertical orbit, reacts to treble
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z += delta * 0.8
      const mat = ring3Ref.current.material as THREE.MeshStandardMaterial
      mat.opacity = 0.15 + treble * 0.4
      mat.emissiveIntensity = glowIntensity + treble * 2.5
    }

    // Particles: expand/contract with audio
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.08
      particlesRef.current.rotation.x += delta * 0.03
      const pScale = 1.0 + bass * 0.15 + mid * 0.1
      particlesRef.current.scale.setScalar(pScale)
      const mat = particlesRef.current.material as THREE.PointsMaterial
      mat.size = 0.04 + treble * 0.06
      mat.opacity = 0.4 + mid * 0.4
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
