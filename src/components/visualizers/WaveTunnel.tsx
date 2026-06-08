import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { COLOR_PRESETS } from '@/lib/constants'

const RING_COUNT = 32

export function WaveTunnel() {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const { getAnalysis } = useAudioAnalyzer()
  const colorPreset = useVisualizerStore((s) => s.colorPreset)
  const glowIntensity = useVisualizerStore((s) => s.glowIntensity)

  const colors = useMemo(() => {
    const preset = COLOR_PRESETS.find((p) => p.id === colorPreset) || COLOR_PRESETS[0]
    return preset.colors.map((c) => new THREE.Color(c))
  }, [colorPreset])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const timeRef = useRef(0)

  useFrame((state, delta) => {
    if (!meshRef.current || !groupRef.current) return
    const analysis = getAnalysis()
    timeRef.current += delta

    for (let i = 0; i < RING_COUNT; i++) {
      const t = i / RING_COUNT
      const z = t * 20 - 10
      const freqIndex = Math.floor(t * (analysis.frequencyData.length * 0.4))
      const freqValue = (analysis.frequencyData[freqIndex] || 0) / 255

      const scale = 1.5 + freqValue * 2 + analysis.bass * 0.5
      const wobble = Math.sin(timeRef.current * 2 + i * 0.5) * 0.2

      dummy.position.set(wobble, wobble, z - (timeRef.current * 3 % 20))
      dummy.rotation.set(0, 0, timeRef.current * 0.3 + i * 0.1)
      dummy.scale.set(scale, scale, 0.05)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      const color = colors[0].clone().lerp(colors[2], t)
      meshRef.current.setColorAt(i, color)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  })

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, RING_COUNT]}>
        <torusGeometry args={[1, 0.02, 8, 32]} />
        <meshStandardMaterial
          emissive={colors[1]}
          emissiveIntensity={glowIntensity * 3}
          toneMapped={false}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
    </group>
  )
}
