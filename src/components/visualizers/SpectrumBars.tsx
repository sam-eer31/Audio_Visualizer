import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { COLOR_PRESETS } from '@/lib/constants'

const BAR_COUNT = 64

export function SpectrumBars() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const { getAnalysis } = useAudioAnalyzer()
  const colorPreset = useVisualizerStore((s) => s.colorPreset)
  const glowIntensity = 0.2

  const colors = useMemo(() => {
    const preset = COLOR_PRESETS.find((p) => p.id === colorPreset) || COLOR_PRESETS[0]
    return preset.colors.map((c) => new THREE.Color(c))
  }, [colorPreset])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame(() => {
    if (!meshRef.current) return
    const analysis = getAnalysis()
    const freq = analysis.frequencyData
    const usableBins = Math.floor(freq.length * 0.6)
    const step = Math.max(1, Math.floor(usableBins / BAR_COUNT))

    for (let i = 0; i < BAR_COUNT; i++) {
      const value = (freq[i * step] || 0) / 255
      const height = Math.max(value * 5, 0.05)

      const x = (i - BAR_COUNT / 2) * 0.25
      dummy.position.set(x, height / 2, 0)
      dummy.scale.set(0.18, height, 0.01)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      const t = i / BAR_COUNT
      const color = colors[0].clone().lerp(colors[2], t)
      meshRef.current.setColorAt(i, color)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, BAR_COUNT]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        emissive={colors[1]}
        emissiveIntensity={glowIntensity * 2}
        toneMapped={false}
        transparent
        opacity={0.9}
      />
    </instancedMesh>
  )
}
