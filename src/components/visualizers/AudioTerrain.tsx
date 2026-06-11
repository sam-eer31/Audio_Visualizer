import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { COLOR_PRESETS } from '@/lib/constants'

const GRID_SIZE = 80
const GRID_SPACING = 0.18

export function AudioTerrain() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { getAnalysis } = useAudioAnalyzer()
  const colorPreset = useVisualizerStore((s) => s.colorPreset)
  const rotationSpeed = useVisualizerStore((s) => s.rotationSpeed)
  const glowIntensity = 0.8

  const colors = useMemo(() => {
    const preset = COLOR_PRESETS.find((p) => p.id === colorPreset) || COLOR_PRESETS[0]
    return preset.colors.map((c) => new THREE.Color(c))
  }, [colorPreset])

  // Store history of frequency snapshots for scrolling terrain
  const historyRef = useRef<Float32Array[]>([])
  const smoothBass = useRef(0)

  useFrame((state, delta) => {
    if (!meshRef.current) return
    const analysis = getAnalysis()
    const freq = analysis.frequencyData
    const geo = meshRef.current.geometry as THREE.PlaneGeometry
    const posAttr = geo.attributes.position as THREE.BufferAttribute
    const colAttr = geo.attributes.color as THREE.BufferAttribute

    smoothBass.current += (analysis.bass - smoothBass.current) * 0.1

    // Sample current frequency data into a row
    const usableBins = Math.floor(freq.length * 0.6)
    const step = Math.max(1, Math.floor(usableBins / GRID_SIZE))
    const currentRow = new Float32Array(GRID_SIZE)
    for (let x = 0; x < GRID_SIZE; x++) {
      // Mirror: left half goes forward, right half mirrors back
      const half = Math.floor(GRID_SIZE / 2)
      const mirrorIdx = x < half ? x : GRID_SIZE - 1 - x
      currentRow[x] = (freq[mirrorIdx * step] || 0) / 255
    }

    // Push to history and maintain size
    historyRef.current.unshift(currentRow)
    if (historyRef.current.length > GRID_SIZE) {
      historyRef.current.pop()
    }

    // Update vertices
    const segX = GRID_SIZE
    const segY = GRID_SIZE
    for (let iy = 0; iy <= segY; iy++) {
      const row = historyRef.current[Math.min(iy, historyRef.current.length - 1)]
      for (let ix = 0; ix <= segX; ix++) {
        const idx = iy * (segX + 1) + ix
        const freqVal = row ? (row[Math.min(ix, GRID_SIZE - 1)] || 0) : 0

        // Set height (Z axis in plane geometry)
        posAttr.setZ(idx, freqVal * 2.5)

        // Color based on height
        const t = Math.min(freqVal * 1.5, 1)
        const color = colors[0].clone().lerp(colors[2], t)
        // Add brightness for peaks
        if (freqVal > 0.6) {
          color.lerp(new THREE.Color(1, 1, 1), (freqVal - 0.6) * 1.5)
        }
        colAttr.setXYZ(idx, color.r, color.g, color.b)
      }
    }

    posAttr.needsUpdate = true
    colAttr.needsUpdate = true
    geo.computeVertexNormals()

    // Gentle rotation
    meshRef.current.rotation.z += delta * rotationSpeed * 0.05
  })

  const geometry = useMemo(() => {
    const totalSize = GRID_SIZE * GRID_SPACING
    const geo = new THREE.PlaneGeometry(totalSize, totalSize, GRID_SIZE, GRID_SIZE)
    // Add color attribute
    const count = geo.attributes.position.count
    const colors = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i++) colors[i] = 0.2
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [])

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      rotation={[-Math.PI / 2.5, 0, 0]}
      position={[0, -1.5, 0]}
    >
      <meshStandardMaterial
        vertexColors
        emissive={colors[1]}
        emissiveIntensity={glowIntensity * 0.8}
        wireframe
        transparent
        opacity={0.85}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  )
}
