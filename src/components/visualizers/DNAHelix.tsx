import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { COLOR_PRESETS } from '@/lib/constants'

const SPHERE_COUNT = 60
const CONNECTOR_COUNT = 30
const PARTICLE_COUNT = 300

export function DNAHelix() {
  const groupRef = useRef<THREE.Group>(null)
  const strand1Ref = useRef<THREE.InstancedMesh>(null)
  const strand2Ref = useRef<THREE.InstancedMesh>(null)
  const connectorsRef = useRef<THREE.InstancedMesh>(null)
  const glowRef = useRef<THREE.InstancedMesh>(null)
  const particlesRef = useRef<THREE.Points>(null)
  const coreRef = useRef<THREE.Mesh>(null)

  const { getAnalysis } = useAudioAnalyzer()
  const colorPreset = useVisualizerStore((s) => s.colorPreset)
  const rotationSpeed = useVisualizerStore((s) => s.rotationSpeed)
  const glowIntensity = 0.8

  const colors = useMemo(() => {
    const preset = COLOR_PRESETS.find((p) => p.id === colorPreset) || COLOR_PRESETS[0]
    return preset.colors.map((c) => new THREE.Color(c))
  }, [colorPreset])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Ambient particles floating around the helix
  const particlePositions = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2
      const y = (Math.random() - 0.5) * 10
      const r = 1.8 + Math.random() * 2.5
      pos[i * 3] = Math.cos(theta) * r
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = Math.sin(theta) * r
    }
    return pos
  }, [])

  const smoothBass = useRef(0)
  const smoothMid = useRef(0)
  const smoothTreble = useRef(0)

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const analysis = getAnalysis()
    const freq = analysis.frequencyData
    const t = state.clock.elapsedTime
    const usableBins = Math.floor(freq.length * 0.6)
    const step = Math.max(1, Math.floor(usableBins / SPHERE_COUNT))

    smoothBass.current += (analysis.bass - smoothBass.current) * 0.12
    smoothMid.current += (analysis.mid - smoothMid.current) * 0.1
    smoothTreble.current += (analysis.treble - smoothTreble.current) * 0.08

    const bass = smoothBass.current
    const mid = smoothMid.current
    const treble = smoothTreble.current

    groupRef.current.rotation.y += delta * rotationSpeed * 0.25

    const helixRadius = 1.4 + bass * 0.5
    const helixHeight = 9
    const twists = 2.5

    // Strand spheres
    for (let i = 0; i < SPHERE_COUNT; i++) {
      const frac = i / SPHERE_COUNT
      const y = (frac - 0.5) * helixHeight
      const angle = frac * Math.PI * 2 * twists + t * 0.6

      const freqValue = (freq[i * step] || 0) / 255
      const r = helixRadius + freqValue * 0.8
      const sphereSize = 0.08 + freqValue * 0.12 + bass * 0.04

      // Strand 1
      if (strand1Ref.current) {
        dummy.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r)
        dummy.scale.setScalar(sphereSize)
        dummy.updateMatrix()
        strand1Ref.current.setMatrixAt(i, dummy.matrix)

        const c1 = colors[0].clone().lerp(colors[1], frac)
        if (freqValue > 0.5) c1.lerp(new THREE.Color(1, 1, 1), (freqValue - 0.5) * 0.6)
        strand1Ref.current.setColorAt(i, c1)
      }

      // Strand 2
      if (strand2Ref.current) {
        dummy.position.set(Math.cos(angle + Math.PI) * r, y, Math.sin(angle + Math.PI) * r)
        dummy.scale.setScalar(sphereSize)
        dummy.updateMatrix()
        strand2Ref.current.setMatrixAt(i, dummy.matrix)

        const c2 = colors[2].clone().lerp(colors[1], frac)
        if (freqValue > 0.5) c2.lerp(new THREE.Color(1, 1, 1), (freqValue - 0.5) * 0.6)
        strand2Ref.current.setColorAt(i, c2)
      }

      // Glow halos around each sphere on strand 1
      if (glowRef.current && i < SPHERE_COUNT) {
        dummy.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r)
        const glowSize = sphereSize * (2.5 + freqValue * 2)
        dummy.scale.setScalar(glowSize)
        dummy.updateMatrix()
        glowRef.current.setMatrixAt(i, dummy.matrix)
        const gc = colors[0].clone().lerp(colors[2], frac)
        glowRef.current.setColorAt(i, gc)
      }
    }

    if (strand1Ref.current) {
      strand1Ref.current.instanceMatrix.needsUpdate = true
      if (strand1Ref.current.instanceColor) strand1Ref.current.instanceColor.needsUpdate = true
    }
    if (strand2Ref.current) {
      strand2Ref.current.instanceMatrix.needsUpdate = true
      if (strand2Ref.current.instanceColor) strand2Ref.current.instanceColor.needsUpdate = true
    }
    if (glowRef.current) {
      glowRef.current.instanceMatrix.needsUpdate = true
      if (glowRef.current.instanceColor) glowRef.current.instanceColor.needsUpdate = true
    }

    // Connectors between strands
    if (connectorsRef.current) {
      for (let i = 0; i < CONNECTOR_COUNT; i++) {
        const frac = (i + 0.5) / CONNECTOR_COUNT
        const y = (frac - 0.5) * helixHeight
        const angle = frac * Math.PI * 2 * twists + t * 0.6

        const freqIdx = Math.floor(frac * SPHERE_COUNT)
        const freqValue = (freq[freqIdx * step] || 0) / 255
        const r = helixRadius + freqValue * 0.8

        const x1 = Math.cos(angle) * r
        const z1 = Math.sin(angle) * r
        const x2 = Math.cos(angle + Math.PI) * r
        const z2 = Math.sin(angle + Math.PI) * r

        const mx = (x1 + x2) / 2
        const mz = (z1 + z2) / 2
        const len = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2)

        dummy.position.set(mx, y, mz)
        dummy.lookAt(x2, y, z2)
        dummy.rotateX(Math.PI / 2)
        const thickness = 0.015 + freqValue * 0.025
        dummy.scale.set(thickness, len, thickness)
        dummy.updateMatrix()
        connectorsRef.current.setMatrixAt(i, dummy.matrix)

        const cc = colors[1].clone()
        cc.multiplyScalar(0.6 + freqValue * 1.5)
        connectorsRef.current.setColorAt(i, cc)
      }
      connectorsRef.current.instanceMatrix.needsUpdate = true
      if (connectorsRef.current.instanceColor) connectorsRef.current.instanceColor.needsUpdate = true
    }

    // Floating particles
    if (particlesRef.current) {
      particlesRef.current.rotation.y -= delta * 0.05
      const mat = particlesRef.current.material as THREE.PointsMaterial
      mat.size = 0.03 + treble * 0.05
      mat.opacity = 0.3 + mid * 0.4
    }

    // Core energy beam
    if (coreRef.current) {
      const coreScale = 0.06 + bass * 0.08
      coreRef.current.scale.set(coreScale, 1, coreScale)
      const mat = coreRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = glowIntensity * 2 + bass * 4
      mat.opacity = 0.15 + bass * 0.35
    }
  })

  return (
    <group ref={groupRef}>
      {/* Strand 1 — solid glowing spheres */}
      <instancedMesh ref={strand1Ref} args={[undefined, undefined, SPHERE_COUNT]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial
          emissive={colors[0]}
          emissiveIntensity={glowIntensity * 2.5}
          toneMapped={false}
          transparent
          opacity={0.95}
        />
      </instancedMesh>

      {/* Strand 2 — solid glowing spheres */}
      <instancedMesh ref={strand2Ref} args={[undefined, undefined, SPHERE_COUNT]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial
          emissive={colors[2]}
          emissiveIntensity={glowIntensity * 2.5}
          toneMapped={false}
          transparent
          opacity={0.95}
        />
      </instancedMesh>

      {/* Glow halos around strand 1 spheres */}
      <instancedMesh ref={glowRef} args={[undefined, undefined, SPHERE_COUNT]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial
          emissive={colors[1]}
          emissiveIntensity={glowIntensity * 3}
          toneMapped={false}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </instancedMesh>

      {/* Connectors */}
      <instancedMesh ref={connectorsRef} args={[undefined, undefined, CONNECTOR_COUNT]}>
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshStandardMaterial
          emissive={colors[1]}
          emissiveIntensity={glowIntensity * 2}
          toneMapped={false}
          transparent
          opacity={0.5}
        />
      </instancedMesh>

      {/* Central energy beam */}
      <mesh ref={coreRef}>
        <cylinderGeometry args={[1, 1, 9, 16]} />
        <meshStandardMaterial
          color={colors[1]}
          emissive={colors[1]}
          emissiveIntensity={glowIntensity * 2}
          toneMapped={false}
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* Ambient floating particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} count={PARTICLE_COUNT} />
        </bufferGeometry>
        <pointsMaterial
          color={colors[1]}
          size={0.04}
          transparent
          opacity={0.4}
          sizeAttenuation
          toneMapped={false}
        />
      </points>
    </group>
  )
}
