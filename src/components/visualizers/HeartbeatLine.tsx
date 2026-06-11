import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { COLOR_PRESETS } from '@/lib/constants'

const POINT_COUNT = 600
const SEGMENT_COUNT = POINT_COUNT - 1
const SWEEP_SPEED = 240 // Faster sweep for high-res waveform painting

export function HeartbeatLine() {
  const segmentsRef = useRef<THREE.InstancedMesh>(null)
  const headGlowRef = useRef<THREE.Mesh>(null)
  
  const { getAnalysis } = useAudioAnalyzer()
  const colorPreset = useVisualizerStore((s) => s.colorPreset)
  const glowIntensity = 0.2

  const colors = useMemo(() => {
    const preset = COLOR_PRESETS.find((p) => p.id === colorPreset) || COLOR_PRESETS[0]
    return preset.colors.map((c) => new THREE.Color(c))
  }, [colorPreset])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  
  // History buffer for the painted waveform
  const historyY = useRef<Float32Array>(new Float32Array(POINT_COUNT))
  const headPos = useRef(0)

  // Initialize history to flatline
  useMemo(() => {
    for (let i = 0; i < POINT_COUNT; i++) historyY.current[i] = 0
  }, [])

  useFrame((_, delta) => {
    if (!segmentsRef.current || !headGlowRef.current) return
    const analysis = getAnalysis()
    
    // Use the raw audio soundwave
    const timeData = analysis.timeDomainData

    // Advance sweeping laser head
    const prevHead = headPos.current
    headPos.current += SWEEP_SPEED * delta
    if (headPos.current >= POINT_COUNT) {
      headPos.current -= POINT_COUNT
    }

    const startIdx = Math.floor(prevHead)
    const endIdx = Math.floor(headPos.current)
    
    let pointsToFill = endIdx - startIdx
    if (pointsToFill < 0) pointsToFill += POINT_COUNT
    
    // Paint the ACTUAL real-time soundwave into the history buffer
    // This perfectly marries the "sweeping left-to-right" heartbeat mechanism 
    // with 100% authentic live sound reactivity.
    for (let i = 0; i <= pointsToFill; i++) {
      let idx = startIdx + i
      if (idx >= POINT_COUNT) idx -= POINT_COUNT
      
      // Sample the current audio frame. We skip a few indices to stretch the wave out nicely.
      const waveIdx = Math.min(i * 3, timeData.length - 1)
      const val = timeData[waveIdx] || 128
      
      // Scale amplitude
      let currentY = ((val - 128) / 128) * 8
      historyY.current[idx] = currentY
    }

    // Determine the current Y of the laser head
    const headY = historyY.current[endIdx] || 0
    const headX = (headPos.current / POINT_COUNT - 0.5) * 24
    headGlowRef.current.position.set(headX, headY, 0.1)
    
    // Render the ultra-thin crisp trace
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      // Hide the wrap-around segment
      if (i === endIdx) {
        dummy.scale.setScalar(0)
        dummy.updateMatrix()
        segmentsRef.current.setMatrixAt(i, dummy.matrix)
        continue
      }

      const x1 = (i / POINT_COUNT - 0.5) * 24
      const x2 = ((i + 1) / POINT_COUNT - 0.5) * 24
      const y1 = historyY.current[i]
      const y2 = historyY.current[i + 1]

      const mx = (x1 + x2) / 2
      const my = (y1 + y2) / 2
      const len = Math.sqrt((x2 - x1)**2 + (y2 - y1)**2)

      dummy.position.set(mx, my, 0)
      dummy.lookAt(x2, y2, 0)
      dummy.rotateX(Math.PI / 2)
      
      // Ultra-thin crisp line (solves "too thick and shitty")
      const thickness = 0.012 
      dummy.scale.set(thickness, len, thickness)
      dummy.updateMatrix()
      segmentsRef.current.setMatrixAt(i, dummy.matrix)
      
      // Fade out trailing line
      let dist = headPos.current - i
      if (dist < 0) dist += POINT_COUNT
      const fade = Math.max(0, 1 - dist / (POINT_COUNT * 0.9))
      
      const color = colors[0].clone().lerp(colors[2], i / POINT_COUNT)
      // Brighten the high peaks
      if (Math.abs(y1) > 2.0) {
        color.lerp(new THREE.Color(1, 1, 1), Math.min((Math.abs(y1) - 2.0) * 0.3, 1))
      }
      color.multiplyScalar(fade * glowIntensity * 1.5)
      segmentsRef.current.setColorAt(i, color)
    }

    segmentsRef.current.instanceMatrix.needsUpdate = true
    if (segmentsRef.current.instanceColor) segmentsRef.current.instanceColor.needsUpdate = true
    
    // Update laser head color
    const hMat = headGlowRef.current.material as THREE.MeshBasicMaterial
    hMat.color.copy(colors[0]).lerp(colors[2], headPos.current / POINT_COUNT)
    hMat.color.multiplyScalar(glowIntensity * 3)
  })

  return (
    <group>
      {/* Sweeping Laser Head */}
      <mesh ref={headGlowRef}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.9} />
      </mesh>

      {/* Ultra-thin Crisp EKG Trace */}
      <instancedMesh ref={segmentsRef} args={[undefined, undefined, SEGMENT_COUNT]}>
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshBasicMaterial toneMapped={false} transparent />
      </instancedMesh>

      {/* Subtle Medical Grid Background */}
      <gridHelper 
        args={[48, 48, colors[1], colors[2]]} 
        rotation={[Math.PI / 2, 0, 0]} 
        position={[0, 0, -2]} 
        material-opacity={0.06} 
        material-transparent={true} 
      />
    </group>
  )
}
