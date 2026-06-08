import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { COLOR_PRESETS } from '@/lib/constants'

export function ParticleGalaxy() {
  const pointsRef = useRef<THREE.Points>(null)
  const { getAnalysis } = useAudioAnalyzer()
  const colorPreset = useVisualizerStore((s) => s.colorPreset)
  const particleCount = useVisualizerStore((s) => s.particleCount)
  const rotationSpeed = useVisualizerStore((s) => s.rotationSpeed)

  const colors = useMemo(() => {
    const preset = COLOR_PRESETS.find((p) => p.id === colorPreset) || COLOR_PRESETS[0]
    return preset.colors.map((c) => new THREE.Color(c))
  }, [colorPreset])

  const { positions, basePositions } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    const base = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      const radius = Math.random() * 5 + 0.5
      const theta = Math.random() * Math.PI * 2
      const phi = (Math.random() - 0.5) * Math.PI
      const x = radius * Math.cos(theta) * Math.cos(phi)
      const y = radius * Math.sin(phi) * 0.3
      const z = radius * Math.sin(theta) * Math.cos(phi)
      pos[i3] = x
      pos[i3 + 1] = y
      pos[i3 + 2] = z
      base[i3] = x
      base[i3 + 1] = y
      base[i3 + 2] = z
    }
    return { positions: pos, basePositions: base }
  }, [particleCount])

  const colorAttr = useMemo(() => {
    const col = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      const t = Math.random()
      const color = colors[0].clone().lerp(colors[2], t)
      col[i * 3] = color.r
      col[i * 3 + 1] = color.g
      col[i * 3 + 2] = color.b
    }
    return col
  }, [particleCount, colors])

  useFrame((state, delta) => {
    if (!pointsRef.current) return
    const analysis = getAnalysis()
    const geo = pointsRef.current.geometry
    const posAttr = geo.attributes.position as THREE.BufferAttribute
    const array = posAttr.array as Float32Array

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      const freqIndex = Math.floor((i / particleCount) * (analysis.frequencyData.length * 0.5))
      const freqValue = (analysis.frequencyData[freqIndex] || 0) / 255
      const displacement = freqValue * 1.5

      array[i3] = basePositions[i3] + Math.sin(state.clock.elapsedTime + i * 0.01) * displacement
      array[i3 + 1] = basePositions[i3 + 1] + freqValue * 0.8
      array[i3 + 2] = basePositions[i3 + 2] + Math.cos(state.clock.elapsedTime + i * 0.01) * displacement
    }

    posAttr.needsUpdate = true
    pointsRef.current.rotation.y += delta * rotationSpeed * 0.2
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colorAttr, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
