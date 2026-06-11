import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { COLOR_PRESETS } from '@/lib/constants'

const gridVertexShader = `
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    vUv = uv;
    vec3 pos = position;

    float dist = length(pos.xz);
    float wave1 = sin(dist * 2.0 - uTime * 3.0) * uBass * 1.5;
    float wave2 = sin(pos.x * 3.0 + uTime * 2.0) * uMid * 0.8;
    float wave3 = cos(pos.z * 3.0 + uTime * 1.5) * uMid * 0.5;

    pos.y += wave1 + wave2 + wave3;
    vElevation = pos.y;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const gridFragmentShader = `
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uGlow;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    float gridX = step(0.98, fract(vUv.x * 30.0)) + step(0.98, fract(vUv.x * 30.0 + 0.5));
    float gridY = step(0.98, fract(vUv.y * 30.0)) + step(0.98, fract(vUv.y * 30.0 + 0.5));
    float grid = max(gridX, gridY);

    vec3 color = mix(uColor1, uColor2, vElevation * 0.5 + 0.5);
    float alpha = grid * 0.8 + 0.05;
    color += grid * uGlow * uColor2 * 2.0;

    gl_FragColor = vec4(color, alpha);
  }
`

export function CyberGrid() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { getAnalysis } = useAudioAnalyzer()
  const colorPreset = useVisualizerStore((s) => s.colorPreset)
  const glowIntensity = 0.8

  const colors = useMemo(() => {
    const preset = COLOR_PRESETS.find((p) => p.id === colorPreset) || COLOR_PRESETS[0]
    return preset.colors.map((c) => new THREE.Color(c))
  }, [colorPreset])

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uBass: { value: 0 },
    uMid: { value: 0 },
    uColor1: { value: colors[0] },
    uColor2: { value: colors[1] },
    uGlow: { value: glowIntensity },
  }), [colors])

  useFrame((state) => {
    if (!meshRef.current) return
    const analysis = getAnalysis()
    const mat = meshRef.current.material as THREE.ShaderMaterial
    mat.uniforms.uTime.value = state.clock.elapsedTime
    mat.uniforms.uBass.value = analysis.bass
    mat.uniforms.uMid.value = analysis.mid
    mat.uniforms.uGlow.value = glowIntensity
  })

  return (
    <group>
      <mesh ref={meshRef} rotation={[-Math.PI / 3, 0, 0]} position={[0, -1, 0]}>
        <planeGeometry args={[20, 20, 100, 100]} />
        <shaderMaterial
          vertexShader={gridVertexShader}
          fragmentShader={gridFragmentShader}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
