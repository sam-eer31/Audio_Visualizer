import { Suspense, lazy } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useVisualizerStore } from '@/stores/visualizerStore'

const SpectrumBars = lazy(() => import('./SpectrumBars').then((m) => ({ default: m.SpectrumBars })))
const CircularSpectrum = lazy(() => import('./CircularSpectrum').then((m) => ({ default: m.CircularSpectrum })))
const ParticleGalaxy = lazy(() => import('./ParticleGalaxy').then((m) => ({ default: m.ParticleGalaxy })))
const AudioSphere = lazy(() => import('./AudioSphere').then((m) => ({ default: m.AudioSphere })))
const WaveTunnel = lazy(() => import('./WaveTunnel').then((m) => ({ default: m.WaveTunnel })))
const NeonRings = lazy(() => import('./NeonRings').then((m) => ({ default: m.NeonRings })))
const FuturisticOrb = lazy(() => import('./FuturisticOrb').then((m) => ({ default: m.FuturisticOrb })))
const CyberGrid = lazy(() => import('./CyberGrid').then((m) => ({ default: m.CyberGrid })))

const VISUALIZER_MAP = {
  'spectrum-bars': SpectrumBars,
  'circular-spectrum': CircularSpectrum,
  'particle-galaxy': ParticleGalaxy,
  'audio-sphere': AudioSphere,
  'wave-tunnel': WaveTunnel,
  'neon-rings': NeonRings,
  'futuristic-orb': FuturisticOrb,
  'cyber-grid': CyberGrid,
} as const

export function VisualizerCanvas() {
  const mode = useVisualizerStore((s) => s.mode)
  const VisualizerComponent = VISUALIZER_MAP[mode]

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} />
      <Suspense fallback={null}>
        <VisualizerComponent />
      </Suspense>
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        maxDistance={20}
        minDistance={3}
      />
    </Canvas>
  )
}
