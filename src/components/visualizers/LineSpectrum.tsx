import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { COLOR_PRESETS } from '@/lib/constants'

const POINTS = 64
const HALF_POINTS = POINTS / 2
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

  // Keep smoothed values for frequency data of the half-spectrum
  const smoothedFreq = useRef<Float32Array>(new Float32Array(HALF_POINTS))

  // Symmetrical irregular spike multipliers generated once
  const spikeMultipliers = useMemo(() => {
    const arr = new Float32Array(HALF_POINTS)
    for (let i = 0; i < HALF_POINTS; i++) {
      // Alternating high and low random multipliers to make peaks highly irregular
      const randomFactor = Math.random()
      arr[i] = 0.35 + randomFactor * 2.0 // Wild variations from 0.35x to 2.35x height
    }
    return arr
  }, [])

  useFrame((state, delta) => {
    if (!meshRef.current) return
    const analysis = getAnalysis()
    const freq = analysis.frequencyData
    const usableBins = Math.floor(freq.length * 0.6)
    // Step size to map the usable frequencies to the half-spectrum
    const step = Math.max(1, Math.floor(usableBins / HALF_POINTS))

    // Smooth bass beat response
    const bass = analysis.bass
    // The irregular spikes activate and grow proportionally with bass energy (beats)
    const spikeIntensity = Math.max(0, bass - 0.25) * 1.4

    // Update smoothed frequency data (half-spectrum)
    for (let i = 0; i < HALF_POINTS; i++) {
      const rawVal = (freq[i * step] || 0) / 255
      const targetVal = rawVal * 4.2 // Base height
      const currentVal = smoothedFreq.current[i]
      const rate = targetVal > currentVal ? 0.4 : 0.18 // Quick response on beat hits
      smoothedFreq.current[i] += (targetVal - currentVal) * rate * (delta * 60)
    }

    // Connect the points with cylinder segments (mirrored center-out with alternating spiky peaks)
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      // Calculate positions
      const x1 = (i - POINTS / 2) * 0.25
      const x2 = ((i + 1) - POINTS / 2) * 0.25

      // Get distance from center (0 to HALF_POINTS) for mirroring
      const dist1 = Math.abs(i - POINTS / 2)
      const dist2 = Math.abs((i + 1) - POINTS / 2)

      const idx1 = Math.min(Math.floor(dist1), HALF_POINTS - 1)
      const idx2 = Math.min(Math.floor(dist2), HALF_POINTS - 1)

      // Apply the dynamic spiky beat multipliers
      const mult1 = 1.0 + (spikeMultipliers[idx1] - 1.0) * spikeIntensity
      const mult2 = 1.0 + (spikeMultipliers[idx2] - 1.0) * spikeIntensity

      // Alternate positive and negative peaks to create a heartbeat EKG outline around y = 0
      const sign1 = i % 2 === 0 ? 1 : -1
      const sign2 = (i + 1) % 2 === 0 ? 1 : -1

      const y1 = smoothedFreq.current[idx1] * mult1 * sign1
      const y2 = smoothedFreq.current[idx2] * mult2 * sign2

      const p1 = new THREE.Vector3(x1, y1, 0)
      const p2 = new THREE.Vector3(x2, y2, 0)

      const midpoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5)
      const dir = new THREE.Vector3().subVectors(p2, p1)
      const length = dir.length()

      dummy.position.copy(midpoint)
      dummy.lookAt(p2)
      dummy.rotateX(Math.PI / 2)

      // Clean visible line thickness
      const thickness = 0.015
      dummy.scale.set(thickness, length, thickness)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      // Symmetric color gradient: starts at colors[0] in the center and blends to colors[2] at the edges
      const centerDist = (dist1 + dist2) / 2
      const t = Math.min(centerDist / HALF_POINTS, 1)
      const color = colors[0].clone().lerp(colors[2], t)

      // Add extra brightness/glow on peak volumes
      const avgY = (Math.abs(y1) + Math.abs(y2)) / 2
      if (avgY > 2.0) {
        color.lerp(new THREE.Color(1, 1, 1), Math.min((avgY - 2.0) * 0.35, 1))
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
