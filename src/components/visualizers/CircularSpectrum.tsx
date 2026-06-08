import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { COLOR_PRESETS } from '@/lib/constants'

const SEGMENT_COUNT = 72

export function CircularSpectrum() {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const { getAnalysis } = useAudioAnalyzer()
  const colorPreset = useVisualizerStore((s) => s.colorPreset)
  const rotationSpeed = useVisualizerStore((s) => s.rotationSpeed)
  const glowIntensity = useVisualizerStore((s) => s.glowIntensity)

  const colors = useMemo(() => {
    const preset = COLOR_PRESETS.find((p) => p.id === colorPreset) || COLOR_PRESETS[0]
    return preset.colors.map((c) => new THREE.Color(c))
  }, [colorPreset])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((_, delta) => {
    if (!meshRef.current || !groupRef.current) return
    const analysis = getAnalysis()
    const freq = analysis.frequencyData
    const step = Math.floor(freq.length / SEGMENT_COUNT)

    groupRef.current.rotation.z += delta * rotationSpeed * 0.3

    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const value = freq[i * step] / 255 || 0
      const angle = (i / SEGMENT_COUNT) * Math.PI * 2
      const radius = 2.5
      const height = Math.max(value * 3, 0.1)

      dummy.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0
      )
      dummy.lookAt(0, 0, 0)
      dummy.scale.set(0.08, height, 0.08)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      const t = i / SEGMENT_COUNT
      const color = colors[0].clone().lerp(colors[2], t)
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
      <mesh>
        <ringGeometry args={[2.2, 2.4, 64]} />
        <meshStandardMaterial
          color={colors[0]}
          emissive={colors[0]}
          emissiveIntensity={glowIntensity}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
