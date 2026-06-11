import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { COLOR_PRESETS } from '@/lib/constants'

export function AudioSphere() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { getAnalysis } = useAudioAnalyzer()
  const colorPreset = useVisualizerStore((s) => s.colorPreset)
  const rotationSpeed = useVisualizerStore((s) => s.rotationSpeed)
  const glowIntensity = 0.8

  const colors = useMemo(() => {
    const preset = COLOR_PRESETS.find((p) => p.id === colorPreset) || COLOR_PRESETS[0]
    return preset.colors.map((c) => new THREE.Color(c))
  }, [colorPreset])

  const basePositions = useRef<Float32Array | null>(null)

  useFrame((state, delta) => {
    if (!meshRef.current) return
    const geo = meshRef.current.geometry as THREE.IcosahedronGeometry
    const posAttr = geo.attributes.position as THREE.BufferAttribute

    if (!basePositions.current) {
      basePositions.current = new Float32Array(posAttr.array)
    }

    const analysis = getAnalysis()
    const base = basePositions.current

    for (let i = 0; i < posAttr.count; i++) {
      const i3 = i * 3
      const bx = base[i3]
      const by = base[i3 + 1]
      const bz = base[i3 + 2]

      const freqIndex = Math.floor((i / posAttr.count) * (analysis.frequencyData.length * 0.3))
      const freqValue = (analysis.frequencyData[freqIndex] || 0) / 255

      const displacement = 1 + freqValue * 0.8 + analysis.bass * 0.3
      posAttr.setXYZ(i, bx * displacement, by * displacement, bz * displacement)
    }

    posAttr.needsUpdate = true
    geo.computeVertexNormals()

    meshRef.current.rotation.y += delta * rotationSpeed * 0.5
    meshRef.current.rotation.x += delta * rotationSpeed * 0.2
  })

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[2, 5]} />
      <meshStandardMaterial
        color={colors[0]}
        emissive={colors[1]}
        emissiveIntensity={glowIntensity * 1.5}
        wireframe
        transparent
        opacity={0.8}
      />
    </mesh>
  )
}
