import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { COLOR_PRESETS } from '@/lib/constants'

const STAR_COUNT = 1500

export function Starfield() {
  const pointsRef = useRef<THREE.Points>(null)
  const { getAnalysis } = useAudioAnalyzer()
  const colorPreset = useVisualizerStore((s) => s.colorPreset)

  const colors = useMemo(() => {
    const preset = COLOR_PRESETS.find((p) => p.id === colorPreset) || COLOR_PRESETS[0]
    return preset.colors.map((c) => new THREE.Color(c))
  }, [colorPreset])

  const { positions, velocities, starColors } = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3)
    const vel = new Float32Array(STAR_COUNT)
    const cols = new Float32Array(STAR_COUNT * 3)

    for (let i = 0; i < STAR_COUNT; i++) {
      // Spread stars in a cylinder around the camera
      const angle = Math.random() * Math.PI * 2
      const radius = 0.5 + Math.random() * 4
      pos[i * 3] = Math.cos(angle) * radius
      pos[i * 3 + 1] = Math.sin(angle) * radius
      pos[i * 3 + 2] = -Math.random() * 40

      vel[i] = 0.5 + Math.random() * 1.5

      // Random color from palette
      const t = Math.random()
      const c = new THREE.Color().lerpColors(
        new THREE.Color('#ffffff'),
        new THREE.Color('#ffffff'),
        t
      )
      cols[i * 3] = c.r
      cols[i * 3 + 1] = c.g
      cols[i * 3 + 2] = c.b
    }
    return { positions: pos, velocities: vel, starColors: cols }
  }, [])

  const smoothBass = useRef(0)
  const smoothMid = useRef(0)
  const smoothTreble = useRef(0)

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    const analysis = getAnalysis()

    smoothBass.current += (analysis.bass - smoothBass.current) * 0.15
    smoothMid.current += (analysis.mid - smoothMid.current) * 0.1
    smoothTreble.current += (analysis.treble - smoothTreble.current) * 0.08

    const speed = 2 + smoothBass.current * 25 + smoothMid.current * 10
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const colAttr = pointsRef.current.geometry.attributes.color as THREE.BufferAttribute
    const arr = posAttr.array as Float32Array
    const colArr = colAttr.array as Float32Array

    for (let i = 0; i < STAR_COUNT; i++) {
      // Move star toward camera (positive Z)
      arr[i * 3 + 2] += velocities[i] * speed * delta

      // Reset star when it passes the camera
      if (arr[i * 3 + 2] > 5) {
        const angle = Math.random() * Math.PI * 2
        const radius = 0.5 + Math.random() * 4
        arr[i * 3] = Math.cos(angle) * radius
        arr[i * 3 + 1] = Math.sin(angle) * radius
        arr[i * 3 + 2] = -35 - Math.random() * 10
      }

      // Color based on distance: far = dim white, close = accent color
      const z = arr[i * 3 + 2]
      const closeness = Math.max(0, (z + 5) / 10)
      const t = Math.min(closeness, 1)
      const c = new THREE.Color(1, 1, 1).lerp(colors[Math.floor(Math.random() * 1000) % 3], t * 0.7)
      colArr[i * 3] = c.r
      colArr[i * 3 + 1] = c.g
      colArr[i * 3 + 2] = c.b
    }

    posAttr.needsUpdate = true
    colAttr.needsUpdate = true

    // Adjust point size based on audio
    const mat = pointsRef.current.material as THREE.PointsMaterial
    mat.size = 0.06 + smoothBass.current * 0.08 + smoothTreble.current * 0.04
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={STAR_COUNT} />
        <bufferAttribute attach="attributes-color" args={[starColors, 3]} count={STAR_COUNT} />
      </bufferGeometry>
      <pointsMaterial
        size={0.07}
        transparent
        opacity={0.9}
        sizeAttenuation
        vertexColors
        toneMapped={false}
      />
    </points>
  )
}
