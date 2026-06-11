import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { COLOR_PRESETS } from '@/lib/constants'

const SEGMENT_COUNT = 128

export function CircularSpectrum() {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const { getAnalysis } = useAudioAnalyzer()
  const colorPreset = useVisualizerStore((s) => s.colorPreset)
  const rotationSpeed = useVisualizerStore((s) => s.rotationSpeed)
  const glowIntensity = 0.2

  const colors = useMemo(() => {
    const preset = COLOR_PRESETS.find((p) => p.id === colorPreset) || COLOR_PRESETS[0]
    return preset.colors.map((c) => new THREE.Color(c))
  }, [colorPreset])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((_, delta) => {
    if (!meshRef.current || !groupRef.current) return
    const analysis = getAnalysis()
    const freq = analysis.frequencyData
    const halfSegments = Math.floor(SEGMENT_COUNT / 2)
    const step = Math.max(1, Math.floor((freq.length * 0.6) / halfSegments))

    groupRef.current.rotation.z += delta * rotationSpeed * 0.3

    for (let i = 0; i < SEGMENT_COUNT; i++) {
      // Mirror: first half goes forward through frequencies, second half mirrors back
      const mirrorIndex = i < halfSegments ? i : SEGMENT_COUNT - 1 - i
      const value = (freq[mirrorIndex * step] || 0) / 255
      const angle = (i / SEGMENT_COUNT) * Math.PI * 2
      const baseRadius = 2.0
      const barLength = Math.max(value * 2.5, 0.05)

      // Position each bar at the edge of the circle, offset outward by half its length
      const cx = Math.cos(angle)
      const cy = Math.sin(angle)

      dummy.position.set(
        cx * (baseRadius + barLength * 0.5),
        cy * (baseRadius + barLength * 0.5),
        0
      )

      // Rotate the bar so its long axis points radially outward
      dummy.rotation.set(0, 0, angle - Math.PI / 2)

      // Scale: thin width, bar length for height, thin depth
      dummy.scale.set(0.06, barLength, 0.06)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      // Color gradient around the circle
      const t = i / SEGMENT_COUNT
      const color = colors[0].clone().lerp(colors[2], t)
      // Brighten bars that have more energy
      color.lerp(new THREE.Color(1, 1, 1), value * 0.3)
      meshRef.current.setColorAt(i, color)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  })

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, SEGMENT_COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          emissive={colors[1]}
          emissiveIntensity={glowIntensity * 2}
          toneMapped={false}
          transparent
          opacity={0.9}
        />
      </instancedMesh>

      {/* Inner ring */}
      <mesh>
        <ringGeometry args={[1.85, 1.95, 64]} />
        <meshStandardMaterial
          color={colors[0]}
          emissive={colors[0]}
          emissiveIntensity={glowIntensity * 0.8}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Outer glow ring */}
      <mesh>
        <ringGeometry args={[1.95, 2.0, 64]} />
        <meshStandardMaterial
          color={colors[2]}
          emissive={colors[2]}
          emissiveIntensity={glowIntensity * 1.2}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
