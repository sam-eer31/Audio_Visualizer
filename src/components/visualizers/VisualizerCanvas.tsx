import { Suspense, lazy, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { useExportStore } from '@/stores/exportStore'
import { useUIStore } from '@/stores/uiStore'
import { BACKGROUND_PRESETS } from '@/lib/constants'
import { RESOLUTION_MAP } from '@/types'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

function isColorDark(hex: string): boolean {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance < 0.5
}

const SpectrumBars = lazy(() => import('./SpectrumBars').then((m) => ({ default: m.SpectrumBars })))
const CircularSpectrum = lazy(() => import('./CircularSpectrum').then((m) => ({ default: m.CircularSpectrum })))
const ParticleGalaxy = lazy(() => import('./ParticleGalaxy').then((m) => ({ default: m.ParticleGalaxy })))
const AudioSphere = lazy(() => import('./AudioSphere').then((m) => ({ default: m.AudioSphere })))
const WaveTunnel = lazy(() => import('./WaveTunnel').then((m) => ({ default: m.WaveTunnel })))
const NeonRings = lazy(() => import('./NeonRings').then((m) => ({ default: m.NeonRings })))
const FuturisticOrb = lazy(() => import('./FuturisticOrb').then((m) => ({ default: m.FuturisticOrb })))
const CyberGrid = lazy(() => import('./CyberGrid').then((m) => ({ default: m.CyberGrid })))
const DNAHelix = lazy(() => import('./DNAHelix').then((m) => ({ default: m.DNAHelix })))
const Starfield = lazy(() => import('./Starfield').then((m) => ({ default: m.Starfield })))
const AudioTerrain = lazy(() => import('./AudioTerrain').then((m) => ({ default: m.AudioTerrain })))
const HeartbeatLine = lazy(() => import('./HeartbeatLine').then((m) => ({ default: m.HeartbeatLine })))

const VISUALIZER_MAP = {
  'spectrum-bars': SpectrumBars,
  'circular-spectrum': CircularSpectrum,
  'particle-galaxy': ParticleGalaxy,
  'audio-sphere': AudioSphere,
  'wave-tunnel': WaveTunnel,
  'neon-rings': NeonRings,
  'futuristic-orb': FuturisticOrb,
  'cyber-grid': CyberGrid,
  'dna-helix': DNAHelix,
  'starfield': Starfield,
  'audio-terrain': AudioTerrain,
  'heartbeat-line': HeartbeatLine,
} as const

function ExportFrameCapturer() {
  const onFrame = useExportStore((s) => s.onFrame)

  useFrame((state) => {
    if (onFrame) {
      state.gl.render(state.scene, state.camera)
      onFrame(state.gl.domElement)
    }
  }, 1)

  return null
}

export function VisualizerCanvas() {
  const mode = useVisualizerStore((s) => s.mode)
  const isExporting = useExportStore((s) => s.isExporting)
  const resolution = useExportStore((s) => s.resolution)
  const expanded = useUIStore((s) => s.expanded)
  const backgroundPreset = useVisualizerStore((s) => s.backgroundPreset)
  
  const bg = BACKGROUND_PRESETS.find((b) => b.id === backgroundPreset) || BACKGROUND_PRESETS[0]
  const darkBg = bg.textColor ? false : isColorDark(bg.color)

  const VisualizerComponent = VISUALIZER_MAP[mode]
  const controlsRef = useRef<any>(null)
  const [dpr, setDpr] = useState<number | [number, number]>([1, 2])

  // Reset 3D rotation whenever the visualizer mode changes
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
  }, [mode])

  // Totally different technique: Inflate the WebGL internal resolution multipliers (DPR) 
  // during export instead of using CSS transforms. This guarantees crisp 1080p/1440p 
  // without breaking the hardware compositor on PC!
  useEffect(() => {
    if (isExporting) {
      const canvas = document.querySelector('canvas')
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        const targetRes = RESOLUTION_MAP[resolution]
        if (rect.width > 0 && rect.height > 0) {
          // Calculate exact pixel multiplier needed to hit target resolution
          const requiredDpr = Math.max(targetRes.width / rect.width, targetRes.height / rect.height)
          setDpr(requiredDpr)
        }
      }
    } else {
      setDpr([1, 2])
    }
  }, [isExporting, resolution])

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
        dpr={dpr}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />
        <Suspense fallback={null}>
          <VisualizerComponent />
        </Suspense>
        <OrbitControls
          ref={controlsRef}
          enableZoom={true}
          enablePan={false}
          maxDistance={20}
          minDistance={3}
        />
        {isExporting && <ExportFrameCapturer />}
      </Canvas>

      {/* Reset Rotation Button */}
      {!isExporting && (
        <button
          onClick={() => controlsRef.current?.reset()}
          className={cn(
            "absolute z-20 h-8 w-8 rounded-lg flex items-center justify-center backdrop-blur-md transition-all shadow-md",
            expanded 
              ? "bottom-20 sm:bottom-28 left-4 sm:left-6" 
              : "bottom-3 left-3",
            darkBg
              ? "bg-black/20 hover:bg-black/40 text-white/70 hover:text-white border border-white/10"
              : "bg-white/70 hover:bg-white/90 text-black/60 hover:text-black border border-black/10"
          )}
          title="Reset 3D Rotation"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
