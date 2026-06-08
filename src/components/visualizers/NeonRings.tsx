import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { COLOR_PRESETS } from '@/lib/constants'

const RING_COUNT = 8

export function NeonRings() {
  const groupRef = useRef<THREE.Group>(null)
  const { getAnalysis } = useAudioAnalyzer()
  const colorPreset = useVisualizerStore((s) => s.colorPreset)
  const glowIntensity = useVisualizerStore((s) => s.glowIntensity)
  const rotationSpeed = useVisualizerStore((s) => s.rotationSpeed)

  const colors = useMemo(() => {
    const preset = COLOR_PRESETS.find((p) => p.id === colorPreset) || COLOR_PRESETS[0]
    return preset.colors.map((c) => new THREE.Color(c))
  }, [colorPreset])

  const ringRefs = useRef<THREE.Mesh[]>([])

  useFrame((state, delta) => {
    const analysis = getAnalysis()
    const time = state.clock.elapsedTime

    ringRefs.current.forEach((ring, i) => {
      if (!ring) return
      const t = i / RING_COUNT
      const freqIndex = Math.floor(t * (analysis.frequencyData.length * 0.5))
      const freqValue = (analysis.frequencyData[freqIndex] || 0) / 255

      const scale = 1 + freqValue * 1.5 + analysis.bass * 0.3
      ring.scale.set(scale, scale, 1)

      ring.rotation.x = time * rotationSpeed * 0.5 * (i % 2 === 0 ? 1 : -1) + i * 0.3
      ring.rotation.y = time * rotationSpeed * 0.3 * (i % 2 === 0 ? -1 : 1)

      const mat = ring.material as THREE.MeshStandardMaterial
      mat.opacity = 0.3 + freqValue * 0.5
      mat.emissiveIntensity = glowIntensity * (1 + freqValue * 3)
    })
  })

  return (
    <group ref={groupRef}>
      {Array.from({ length: RING_COUNT }).map((_, i) => {
        const radius = 1 + i * 0.5
        const color = colors[i % colors.length]
        return (
          <mesh
            key={i}
            ref={(el) => { if (el) ringRefs.current[i] = el }}
          >
            <torusGeometry args={[radius, 0.03, 16, 64]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={glowIntensity * 2}
              toneMapped={false}
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}
    </group>
  )
}
