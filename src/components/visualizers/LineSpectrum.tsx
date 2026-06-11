import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { COLOR_PRESETS } from '@/lib/constants'

const POINTS = 64
const SEGMENT_COUNT = POINTS - 1

export function LineSpectrum() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const { getAnalysis } = useAudioAnalyzer()
  const colorPreset = useVisualizerStore((s) => s.colorPreset)
  const glowIntensity = 0.2

  const colors = useMemo(() => {
    const preset = COLOR_PRESETS.find((p) => p.id === colorPreset) || COLOR_PRESETS[0]
    return preset.colors.map((c) => new THREE.Color(c))
  }, [colorPreset])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Keep smoothed values for frequency data
  const smoothedFreq = useRef<Float32Array>(new Float32Array(POINTS))

  useFrame((state, delta) => {
    if (!meshRef.current) return
    const analysis = getAnalysis()
    const freq = analysis.frequencyData
    const usableBins = Math.floor(freq.length * 0.6)
    const step = Math.max(1, Math.floor(usableBins / POINTS))

    // Update smoothed frequency data
    for (let i = 0; i < POINTS; i++) {
      const rawVal = (freq[i * step] || 0) / 255
      // Fast response, slow decay for clean spectrum physics
      const targetVal = rawVal * 5
      const currentVal = smoothedFreq.current[i]
      const rate = targetVal > currentVal ? 0.3 : 0.15
      smoothedFreq.current[i] += (targetVal - currentVal) * rate * (delta * 60)
    }

    // Connect the points with cylinder segments
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const x1 = (i - POINTS / 2) * 0.25
      const x2 = ((i + 1) - POINTS / 2) * 0.25

      const y1 = Math.max(smoothedFreq.current[i], 0.05)
      const y2 = Math.max(smoothedFreq.current[i + 1], 0.05)

      const p1 = new THREE.Vector3(x1, y1, 0)
      const p2 = new THREE.Vector3(x2, y2, 0)

      const midpoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5)
      const dir = new THREE.Vector3().subVectors(p2, p1)
      const length = dir.length()

      dummy.position.copy(midpoint)
      dummy.lookAt(p2)
      dummy.rotateX(Math.PI / 2)

      // Clean visible line thickness
      const thickness = 0.06
      dummy.scale.set(thickness, length, thickness)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      // Match the gradient look of SpectrumBars from left to right
      const t = i / POINTS
      const color = colors[0].clone().lerp(colors[2], t)

      // Add extra glow brightness on peaks
      if (smoothedFreq.current[i] > 2.5) {
        color.lerp(new THREE.Color(1, 1, 1), (smoothedFreq.current[i] - 2.5) * 0.3)
      }

      meshRef.current.setColorAt(i, color)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, SEGMENT_COUNT]}>
      <cylinderGeometry args={[1, 1, 1, 6]} />
      <meshStandardMaterial
        toneMapped={false}
        transparent
        opacity={0.9}
        emissive={colors[1]}
        emissiveIntensity={glowIntensity * 2.5}
      />
    </instancedMesh>
  )
}
