import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { COLOR_PRESETS } from '@/lib/constants'

const POINTS = 80
const HALF_POINTS = POINTS / 2
const SEGMENT_COUNT = POINTS

export function MobiusRibbon() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const { getAnalysis } = useAudioAnalyzer()
  const colorPreset = useVisualizerStore((s) => s.colorPreset)
  const glowIntensity = 0.2

  const colors = useMemo(() => {
    const preset = COLOR_PRESETS.find((p) => p.id === colorPreset) || COLOR_PRESETS[0]
    return preset.colors.map((c) => new THREE.Color(c))
  }, [colorPreset])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Smooth values for the half-spectrum frequency mapping
  const smoothedFreq = useRef<Float32Array>(new Float32Array(HALF_POINTS))

  useFrame((state, delta) => {
    if (!meshRef.current) return
    const analysis = getAnalysis()
    const freq = analysis.frequencyData
    const usableBins = Math.floor(freq.length * 0.6)
    const step = Math.max(1, Math.floor(usableBins / HALF_POINTS))
    const time = state.clock.elapsedTime

    // Smooth incoming frequency values
    for (let i = 0; i < HALF_POINTS; i++) {
      const rawVal = (freq[i * step] || 0) / 255
      const targetVal = rawVal * 1.5 // Radial expansion scale
      const currentVal = smoothedFreq.current[i]
      const rate = targetVal > currentVal ? 0.35 : 0.18 // Quick growth, smooth decay
      smoothedFreq.current[i] += (targetVal - currentVal) * rate * (delta * 60)
    }

    const baseRadius = 2.0 + analysis.bass * 0.4 // Bass pulses expand the overall radius

    for (let i = 0; i < POINTS; i++) {
      const nextIndex = (i + 1) % POINTS

      // Angles around the circle
      const angle1 = (i / POINTS) * Math.PI * 2
      const angle2 = (nextIndex / POINTS) * Math.PI * 2

      // Symmetrical index mapping
      const dist1 = Math.abs(i - POINTS / 2)
      const dist2 = Math.abs(nextIndex - POINTS / 2)

      const idx1 = Math.min(Math.floor(dist1), HALF_POINTS - 1)
      const idx2 = Math.min(Math.floor(dist2), HALF_POINTS - 1)

      const r1 = baseRadius + smoothedFreq.current[idx1]
      const r2 = baseRadius + smoothedFreq.current[idx2]

      // Twist and wave in Z-depth space (Mobius torsion)
      const z1 = Math.sin(angle1 * 1.5 + time * 1.2) * 0.5
      const z2 = Math.sin(angle2 * 1.5 + time * 1.2) * 0.5

      const p1 = new THREE.Vector3(Math.cos(angle1) * r1, Math.sin(angle1) * r1, z1)
      const p2 = new THREE.Vector3(Math.cos(angle2) * r2, Math.sin(angle2) * r2, z2)

      const midpoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5)
      const dir = new THREE.Vector3().subVectors(p2, p1)
      const length = dir.length()

      dummy.position.copy(midpoint)
      dummy.lookAt(p2)
      dummy.rotateX(Math.PI / 2)

      // Thin sleek ribbon cylinder thickness
      const thickness = 0.024
      dummy.scale.set(thickness, length, thickness)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      // Symmetrical color gradient around the circle
      const t = Math.min(dist1 / HALF_POINTS, 1)
      const color = colors[0].clone().lerp(colors[2], t)

      // Add extra brightness for active peaks
      const avgAmp = (smoothedFreq.current[idx1] + smoothedFreq.current[idx2]) / 2
      if (avgAmp > 0.5) {
        color.lerp(new THREE.Color(1, 1, 1), Math.min((avgAmp - 0.5) * 0.4, 0.6))
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
