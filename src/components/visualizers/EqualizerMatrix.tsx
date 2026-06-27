import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { COLOR_PRESETS } from '@/lib/constants'

const GRID_SIZE = 14 // 14x14 matrix of pillars
const TOTAL_PILLARS = GRID_SIZE * GRID_SIZE
const COLUMN_SPACING = 0.7

// Custom Box Shaders for Holographic Pillars
const pillarVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vInstanceColor;

  void main() {
    vUv = uv;
    vPosition = position;
    vInstanceColor = instanceColor;
    
    // Multiply by the instanced transformation matrix to position and scale each pillar
    vec4 localPosition = instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * localPosition;
  }
`

const pillarFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vInstanceColor;

  void main() {
    // Edge detection for wireframe outline glow
    float edgeX = step(0.045, vUv.x) * step(vUv.x, 0.955);
    float edgeY = step(0.045, vUv.y) * step(vUv.y, 0.955);
    float border = 1.0 - (edgeX * edgeY);

    // Glowing scanlines running vertically
    float scanline = sin(vPosition.y * 12.0 - uTime * 6.0) * 0.5 + 0.5;

    // Beautiful vertical gradient using theme colors
    vec3 gradColor;
    if (vUv.y < 0.5) {
      gradColor = mix(uColor1, uColor2, vUv.y * 2.0);
    } else {
      gradColor = mix(uColor2, uColor3, (vUv.y - 0.5) * 2.0);
    }
    
    // Apply audio reactivity intensity from instance color (grayscale)
    gradColor *= vInstanceColor.r;
    
    // Core holographic color blending
    vec3 col = mix(gradColor * 0.25, gradColor * 2.0, border);
    
    // Extra brightness and intensity towards the top
    float topGlow = smoothstep(0.6, 1.0, vUv.y);
    col += gradColor * topGlow * 1.5;

    col += vec3(1.0) * (scanline * 0.15); // white scanline flash

    // High transparency inside, highly opaque on borders
    float alpha = mix(0.12, 0.95, border) + scanline * 0.08 + topGlow * 0.3;

    gl_FragColor = vec4(col, alpha);
  }
`

export function EqualizerMatrix() {
  const groupRef = useRef<THREE.Group>(null)
  const gridRef = useRef<THREE.InstancedMesh>(null)
  const lasersRef = useRef<THREE.InstancedMesh>(null)

  const { getAnalysis } = useAudioAnalyzer()
  const colorPreset = useVisualizerStore((s) => s.colorPreset)
  const rotationSpeed = useVisualizerStore((s) => s.rotationSpeed)
  const glowIntensity = 0.2

  const colors = useMemo(() => {
    const preset = COLOR_PRESETS.find((p) => p.id === colorPreset) || COLOR_PRESETS[0]
    return preset.colors.map((c) => new THREE.Color(c))
  }, [colorPreset])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Pre-calculate positions and frequency indices for each pillar in the grid
  const pillarData = useMemo(() => {
    const list = []
    const center = (GRID_SIZE - 1) / 2
    const maxDist = Math.sqrt(center * center * 2)

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const x = (col - center) * COLUMN_SPACING
        const z = (row - center) * COLUMN_SPACING
        
        // Radial distance from center grid point
        const dx = col - center
        const dz = row - center
        const dist = Math.sqrt(dx * dx + dz * dz)
        
        // Map distance to a frequency range fraction (closer to center = bass, further = treble)
        const freqFrac = Math.min(dist / maxDist, 1.0)

        list.push({ x, z, freqFrac })
      }
    }
    return list
  }, [])

  // Position coordinates for 4 laser emitters at the corner regions of the matrix
  const laserPositions = useMemo(() => [
    { x: -3.5, z: -3.5 },
    { x: 3.5, z: -3.5 },
    { x: -3.5, z: 3.5 },
    { x: 3.5, z: 3.5 }
  ], [])

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color() },
    uColor2: { value: new THREE.Color() },
    uColor3: { value: new THREE.Color() },
  }), [])



  const smoothBass = useRef(0)

  // Cache individual cylinder/cube heights for smooth interpolation
  const pillarHeights = useMemo(() => new Float32Array(TOTAL_PILLARS), [])

  useFrame((state) => {
    if (!groupRef.current || !gridRef.current || !lasersRef.current) return
    
    const analysis = getAnalysis()
    const freq = analysis.frequencyData
    const t = state.clock.elapsedTime

    smoothBass.current += (analysis.bass - smoothBass.current) * 0.15
    const bass = smoothBass.current
    const usableBins = Math.floor(freq.length * 0.5)

    // Update uTime uniform
    const gridMat = gridRef.current.material as THREE.ShaderMaterial
    gridMat.uniforms.uTime.value = t
    gridMat.uniforms.uColor1.value.copy(colors[0])
    gridMat.uniforms.uColor2.value.copy(colors[1])
    gridMat.uniforms.uColor3.value.copy(colors[2] || colors[1])

    // Update 3D grid pillars
    pillarData.forEach((p, idx) => {
      const binIdx = Math.floor(p.freqFrac * usableBins)
      const rawVal = (freq[binIdx] || 0) / 255.0
      
      const targetHeight = 0.15 + rawVal * 4.5 + (p.freqFrac < 0.3 ? bass * 1.0 : 0)

      pillarHeights[idx] += (targetHeight - pillarHeights[idx]) * 0.2
      const h = pillarHeights[idx]

      dummy.position.set(p.x, h / 2 - 1.5, p.z)
      dummy.scale.set(0.5, h, 0.5)
      dummy.updateMatrix()
      gridRef.current!.setMatrixAt(idx, dummy.matrix)

      // Just pass brightness/pulse via color since shader handles the gradient
      const c = new THREE.Color(1, 1, 1).multiplyScalar(0.7 + rawVal * 1.5)
      gridRef.current!.setColorAt(idx, c)
    })

    gridRef.current.instanceMatrix.needsUpdate = true
    if (gridRef.current.instanceColor) gridRef.current.instanceColor.needsUpdate = true

    // Animate reactive corner laser beams shooting up on bass hits
    laserPositions.forEach((pos, idx) => {
      const activeHeight = 0.1 + bass * 15.0 // shoot up to 15 units high
      const isShooting = bass > 0.55

      dummy.position.set(pos.x, activeHeight / 2 - 1.5, pos.z)
      dummy.scale.set(1.0, activeHeight, 1.0)
      dummy.updateMatrix()
      lasersRef.current!.setMatrixAt(idx, dummy.matrix)

      const laserColor = colors[idx % colors.length].clone()
      laserColor.multiplyScalar(isShooting ? 3.0 : 0.2)
      lasersRef.current!.setColorAt(idx, laserColor)
    })

    lasersRef.current.instanceMatrix.needsUpdate = true
    if (lasersRef.current.instanceColor) lasersRef.current.instanceColor.needsUpdate = true

    const laserMat = lasersRef.current.material as THREE.MeshBasicMaterial
    laserMat.opacity = 0.05 + bass * 0.75

    // Group global rotate
    groupRef.current.rotation.y = t * rotationSpeed * 0.2
    groupRef.current.rotation.x = 0.3 + Math.sin(t * 0.1) * 0.08
  })

  return (
    <group ref={groupRef}>
      {/* 3D Holographic Equalizer Pillars */}
      <instancedMesh ref={gridRef} args={[undefined, undefined, TOTAL_PILLARS]}>
        <boxGeometry args={[1, 1, 1]} />
        <shaderMaterial
          vertexShader={pillarVertexShader}
          fragmentShader={pillarFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>

      {/* Reactive Laser Columns */}
      <instancedMesh ref={lasersRef} args={[undefined, undefined, laserPositions.length]}>
        <cylinderGeometry args={[0.015, 0.015, 1, 8]} />
        <meshBasicMaterial
          transparent
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  )
}
