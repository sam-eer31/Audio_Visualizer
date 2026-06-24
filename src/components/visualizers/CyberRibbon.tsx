import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { COLOR_PRESETS } from '@/lib/constants'

// Ribbon Shaders
const ribbonVertexShader = `
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform float uPhaseOffset;
  varying vec2 vUv;
  varying float vElevation;
  varying float vBass;
  varying float vMid;
  varying float vTreble;

  void main() {
    vUv = uv;
    vBass = uBass;
    vMid = uMid;
    vTreble = uTreble;
    vec3 pos = position;

    // Treat y position as the length parameter along the ribbon spline
    float lengthParam = pos.y;

    // Spline wave deformations driven by time, phase offset, and audio frequencies
    float frequency = 0.6;
    float timeSpeed = uTime * 1.5 + uPhaseOffset;
    
    // Bass drives the primary wave amplitude — ribbons visibly expand/contract on kicks
    float waveX = sin(lengthParam * frequency - timeSpeed) * (1.0 + uBass * 2.0);
    float waveZ = cos(lengthParam * (frequency * 0.8) + timeSpeed * 0.9) * (0.8 + uMid * 1.8);
    
    // Treble-reactive high-frequency secondary ripples
    float ripple = sin(lengthParam * 3.5 - uTime * 5.0) * uTreble * 0.35;

    // Mid-driven ribbon width breathing — ribbon gets wider on mids
    float widthMult = 1.0 + uMid * 0.6 + uBass * 0.3;
    pos.x *= widthMult;

    pos.x += waveX + ripple;
    pos.z += waveZ + ripple * 0.6;
    vElevation = waveX + waveZ;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const ribbonFragmentShader = `
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uTime;
  uniform float uTreble;
  uniform float uBass;
  uniform float uMid;
  varying vec2 vUv;
  varying float vElevation;
  varying float vBass;
  varying float vMid;
  varying float vTreble;

  void main() {
    // Holographic scanlines moving along the length (vUv.y) of the ribbon
    // Speed reacts to audio energy — scanlines move faster with the beat
    float scanSpeed = 12.0 + vBass * 8.0 + vMid * 4.0;
    float scanline = sin(vUv.y * 80.0 - uTime * scanSpeed) * 0.5 + 0.5;
    scanline = step(0.88, scanline); // Crisp thin lines

    // Energy pulse wave traveling along the ribbon — visible audio pulse
    float energyPulse = sin(vUv.y * 6.28 - uTime * 4.0) * 0.5 + 0.5;
    energyPulse = pow(energyPulse, 3.0) * (0.3 + vBass * 0.7);

    // Soft border grids (vUv.x is 0 at left edge, 1 at right edge)
    float edgeMask = smoothstep(0.0, 0.03, vUv.x) * smoothstep(1.0, 0.97, vUv.x);
    float glowEdges = (1.0 - edgeMask);
    
    // Edge glow reacts to bass — ribbon borders light up on beats
    glowEdges *= (1.0 + vBass * 1.5);

    // Mix theme colors
    vec3 baseColor = mix(uColor1, uColor2, vElevation * 0.2 + 0.5);
    vec3 highlightColor = vec3(1.0) * (0.7 + uTreble * 1.0);
    
    // Energy pulse adds a warm bright band along the ribbon
    vec3 pulseColor = mix(uColor1, uColor2, 0.7) * 1.5;
    
    vec3 finalColor = mix(baseColor, highlightColor, scanline * 0.5 + glowEdges * 0.6);
    finalColor += pulseColor * energyPulse;
    
    float alpha = (0.2 + scanline * 0.35 + glowEdges * 0.6 + energyPulse * 0.4) * edgeMask;
    // Overall brightness reacts to bass — ribbon glows brighter on beats
    alpha *= (0.8 + vBass * 0.4);

    gl_FragColor = vec4(finalColor, alpha);
  }
`

const PARTICLE_COUNT = 800

export function CyberRibbon() {
  const groupRef = useRef<THREE.Group>(null)
  const ribbon1Ref = useRef<THREE.Mesh>(null)
  const ribbon2Ref = useRef<THREE.Mesh>(null)
  const ribbon3Ref = useRef<THREE.Mesh>(null)
  const particlesRef = useRef<THREE.Points>(null)

  const { getAnalysis } = useAudioAnalyzer()
  const colorPreset = useVisualizerStore((s) => s.colorPreset)
  const rotationSpeed = useVisualizerStore((s) => s.rotationSpeed)

  const colors = useMemo(() => {
    const preset = COLOR_PRESETS.find((p) => p.id === colorPreset) || COLOR_PRESETS[0]
    return preset.colors.map((c) => new THREE.Color(c))
  }, [colorPreset])

  // Setup uniforms
  const uniforms1 = useMemo(() => ({
    uTime: { value: 0 },
    uBass: { value: 0 },
    uMid: { value: 0 },
    uTreble: { value: 0 },
    uPhaseOffset: { value: 0 },
    uColor1: { value: colors[0] },
    uColor2: { value: colors[1] },
  }), [colors])

  const uniforms2 = useMemo(() => ({
    uTime: { value: 0 },
    uBass: { value: 0 },
    uMid: { value: 0 },
    uTreble: { value: 0 },
    uPhaseOffset: { value: Math.PI * 0.67 }, // Out of phase
    uColor1: { value: colors[1] },
    uColor2: { value: colors[2] },
  }), [colors])

  const uniforms3 = useMemo(() => ({
    uTime: { value: 0 },
    uBass: { value: 0 },
    uMid: { value: 0 },
    uTreble: { value: 0 },
    uPhaseOffset: { value: Math.PI * 1.33 }, // Out of phase
    uColor1: { value: colors[2] },
    uColor2: { value: colors[0] },
  }), [colors])

  // Ambient/Trailing ribbon particles
  const particleData = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3)
    const angles = new Float32Array(PARTICLE_COUNT)
    const speeds = new Float32Array(PARTICLE_COUNT)
    const yVals = new Float32Array(PARTICLE_COUNT)
    const offsets = new Float32Array(PARTICLE_COUNT)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Span particles along length (-6 to 6)
      const y = (Math.random() - 0.5) * 12.0
      yVals[i] = y
      angles[i] = Math.random() * Math.PI * 2
      speeds[i] = 0.5 + Math.random() * 1.0
      offsets[i] = Math.random() * Math.PI * 2
      
      pos[i * 3] = 0
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = 0
    }
    return { pos, angles, speeds, yVals, offsets }
  }, [])

  const smoothBass = useRef(0)
  const smoothMid = useRef(0)
  const smoothTreble = useRef(0)

  useFrame((state, delta) => {
    if (!groupRef.current || !ribbon1Ref.current || !ribbon2Ref.current || !ribbon3Ref.current || !particlesRef.current) return
    
    const analysis = getAnalysis()
    const t = state.clock.elapsedTime

    // Smooth audio — responsive enough to clearly see beats, not jittery
    smoothBass.current += (analysis.bass - smoothBass.current) * 0.12
    smoothMid.current += (analysis.mid - smoothMid.current) * 0.1
    smoothTreble.current += (analysis.treble - smoothTreble.current) * 0.08

    const bass = smoothBass.current
    const mid = smoothMid.current
    const treble = smoothTreble.current

    // Update uniforms
    const updateUniforms = (mat: THREE.ShaderMaterial) => {
      mat.uniforms.uTime.value = t
      mat.uniforms.uBass.value = bass
      mat.uniforms.uMid.value = mid
      mat.uniforms.uTreble.value = treble
    }

    updateUniforms(ribbon1Ref.current.material as THREE.ShaderMaterial)
    updateUniforms(ribbon2Ref.current.material as THREE.ShaderMaterial)
    updateUniforms(ribbon3Ref.current.material as THREE.ShaderMaterial)

    // Swirl particles around the active ribbon splines
    const pGeom = particlesRef.current.geometry
    const pPosAttr = pGeom.attributes.position as THREE.BufferAttribute
    const pPosArr = pPosAttr.array as Float32Array

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const y = particleData.yVals[i]
      
      // Update angle to create orbital swirling — speed reacts to mid
      particleData.angles[i] += particleData.speeds[i] * delta * (1.0 + mid * 1.5)
      const angle = particleData.angles[i]
      
      // Calculate spline-matching center path based on time
      const offset = particleData.offsets[i]
      const splineX = Math.sin(y * 0.6 - (t * 1.5 + offset)) * (1.0 + bass * 2.0)
      const splineZ = Math.cos(y * 0.48 + (t * 1.5 + offset)) * (0.8 + mid * 1.8)

      // Spiral radius reactive to treble (high frequencies expand orbits)
      const orbitRadius = 0.35 + Math.sin(t * 3.0 + y) * 0.15 + treble * 0.4

      const px = splineX + Math.cos(angle) * orbitRadius
      const pz = splineZ + Math.sin(angle) * orbitRadius

      const i3 = i * 3
      pPosArr[i3] = px
      pPosArr[i3 + 1] = y
      pPosArr[i3 + 2] = pz
    }
    pPosAttr.needsUpdate = true

    // Rotate the overall container slowly
    groupRef.current.rotation.y += delta * rotationSpeed * 0.25
    groupRef.current.rotation.x = Math.sin(t * 0.2) * 0.1
    
    // Scale particle sizes on highs
    const pMat = particlesRef.current.material as THREE.PointsMaterial
    pMat.size = 0.03 + treble * 0.05
    pMat.opacity = 0.5 + bass * 0.3
  })

  return (
    <group ref={groupRef}>
      {/* Ribbon 1 */}
      <mesh ref={ribbon1Ref}>
        <planeGeometry args={[0.5, 12, 4, 80]} />
        <shaderMaterial
          vertexShader={ribbonVertexShader}
          fragmentShader={ribbonFragmentShader}
          uniforms={uniforms1}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Ribbon 2 */}
      <mesh ref={ribbon2Ref} rotation={[0, Math.PI / 3, 0]}>
        <planeGeometry args={[0.5, 12, 4, 80]} />
        <shaderMaterial
          vertexShader={ribbonVertexShader}
          fragmentShader={ribbonFragmentShader}
          uniforms={uniforms2}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Ribbon 3 */}
      <mesh ref={ribbon3Ref} rotation={[0, -Math.PI / 3, 0]}>
        <planeGeometry args={[0.5, 12, 4, 80]} />
        <shaderMaterial
          vertexShader={ribbonVertexShader}
          fragmentShader={ribbonFragmentShader}
          uniforms={uniforms3}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Ribbon-associated Swirling Dust particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particleData.pos, 3]} count={PARTICLE_COUNT} />
        </bufferGeometry>
        <pointsMaterial
          color={colors[1]}
          size={0.03}
          transparent
          opacity={0.6}
          sizeAttenuation
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
