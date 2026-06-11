import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { COLOR_PRESETS } from '@/lib/constants'

const POINTS = 80
const SEGMENTS_PER_LINE = POINTS - 1
const LINE_COUNT = 3
const TOTAL_SEGMENTS = SEGMENTS_PER_LINE * LINE_COUNT

export function LineSpectrum() {
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

  // Keep a history of smoothed frequency data for each line
  const smoothedFreqs = useRef<Float32Array[]>([])
  if (smoothedFreqs.current.length === 0) {
    for (let j = 0; j < LINE_COUNT; j++) {
      smoothedFreqs.current.push(new Float32Array(POINTS))
    }
  }

  useFrame((state, delta) => {
    if (!meshRef.current) return
    const analysis = getAnalysis()
    const freq = analysis.frequencyData
    const usableBins = Math.floor(freq.length * 0.75)
    const step = Math.max(1, Math.floor(usableBins / POINTS))
    const time = state.clock.elapsedTime

    let segmentIdx = 0

    for (let j = 0; j < LINE_COUNT; j++) {
      // Different smoothing factors for each line to create a staggered 3D wave trail
      const lerpFactor = 0.18 - j * 0.05
      const smoothVal = smoothedFreqs.current[j]

      // Update smoothed values for this line
      for (let i = 0; i < POINTS; i++) {
        const rawVal = (freq[i * step] || 0) / 255
        smoothVal[i] += (rawVal - smoothVal[i]) * lerpFactor * (delta * 60)
      }

      // Build segments
      for (let i = 0; i < SEGMENTS_PER_LINE; i++) {
        const x1 = ((i / POINTS) - 0.5) * 16
        const x2 = (((i + 1) / POINTS) - 0.5) * 16

        // Scale height reactively. Back lines are scaled slightly smaller for depth perception.
        const heightScale = 4.5 - j * 0.8
        const y1 = smoothVal[i] * heightScale - 1.0
        const y2 = smoothVal[i + 1] * heightScale - 1.0

        // Push lines back in Z space and make them sway gently
        const z = -j * 1.0 + Math.sin(time * 1.2 + j * 0.8) * 0.15

        const p1 = new THREE.Vector3(x1, y1, z)
        const p2 = new THREE.Vector3(x2, y2, z)

        const midpoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5)
        const dir = new THREE.Vector3().subVectors(p2, p1)
        const length = dir.length()

        dummy.position.copy(midpoint)
        dummy.lookAt(p2)
        dummy.rotateX(Math.PI / 2)

        const thickness = 0.024 - j * 0.005
        dummy.scale.set(thickness, length, thickness)
        dummy.updateMatrix()
        meshRef.current.setMatrixAt(segmentIdx, dummy.matrix)

        // Interpolated color gradient from start to end of line
        const t = i / POINTS
        const color = colors[j].clone().lerp(colors[(j + 1) % colors.length], t)
        
        // Brighter peaks
        if (smoothVal[i] > 0.4) {
          color.lerp(new THREE.Color(1, 1, 1), (smoothVal[i] - 0.4) * 0.5)
        }
        
        meshRef.current.setColorAt(segmentIdx, color)
        segmentIdx++
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, TOTAL_SEGMENTS]}>
      <cylinderGeometry args={[1, 1, 1, 6]} />
      <meshStandardMaterial
        toneMapped={false}
        transparent
        opacity={0.85}
        emissive={colors[1]}
        emissiveIntensity={glowIntensity * 2.5}
      />
    </instancedMesh>
  )
}
