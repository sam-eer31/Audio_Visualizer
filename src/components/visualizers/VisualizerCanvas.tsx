import { Suspense, lazy, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { useExportStore } from '@/stores/exportStore'
import { useUIStore } from '@/stores/uiStore'
import { BACKGROUND_PRESETS } from '@/lib/constants'
import { RESOLUTION_MAP } from '@/types'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

function isColorDark(hex: string): boolean {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance < 0.5
}

const LineSpectrum = lazy(() => import('./LineSpectrum').then((m) => ({ default: m.LineSpectrum })))
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
const MobiusRibbon = lazy(() => import('./MobiusRibbon').then((m) => ({ default: m.MobiusRibbon })))
const LaserWeb = lazy(() => import('./LaserWeb').then((m) => ({ default: m.LaserWeb })))
const AudioPortal = lazy(() => import('./AudioPortal').then((m) => ({ default: m.AudioPortal })))
const QuantumSupernova = lazy(() => import('./QuantumSupernova').then((m) => ({ default: m.QuantumSupernova })))
const CyberRibbon = lazy(() => import('./CyberRibbon').then((m) => ({ default: m.CyberRibbon })))
const EqualizerMatrix = lazy(() => import('./EqualizerMatrix').then((m) => ({ default: m.EqualizerMatrix })))
const BeatDice = lazy(() => import('./BeatDice').then((m) => ({ default: m.BeatDice })))

const VISUALIZER_MAP = {
  'line-spectrum': LineSpectrum,
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
  'mobius-ribbon': MobiusRibbon,
  'laser-web': LaserWeb,
  'audio-portal': AudioPortal,
  'quantum-supernova': QuantumSupernova,
  'cyber-ribbon': CyberRibbon,
  'equalizer-matrix': EqualizerMatrix,
  'beat-dice': BeatDice,
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

function CameraController({ controlsRef }: { controlsRef: React.RefObject<any> }) {
  const { camera, size } = useThree()

  useEffect(() => {
    const aspect = size.width / size.height
    // Base camera distance is 8
    // If screen is vertical or narrow (aspect < 1.25), scale distance to keep the model fully visible and centered
    let targetDistance = 8
    if (aspect < 1.25) {
      targetDistance = 8 * (1.25 / aspect)
    }

    const currentDistance = camera.position.length()
    if (currentDistance > 0) {
      // Scale current position vector to match targetDistance while preserving orientation
      camera.position.multiplyScalar(targetDistance / currentDistance)
    }
    camera.updateProjectionMatrix()

    if (controlsRef.current) {
      controlsRef.current.update()
    }
  }, [size.width, size.height, camera, controlsRef])

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
  const [isRotated, setIsRotated] = useState(false)

  // Reset 3D rotation whenever the visualizer mode changes
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.reset()
      setIsRotated(false)
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
          onChange={() => {
            if (controlsRef.current) {
              const controls = controlsRef.current
              const theta = controls.getAzimuthalAngle()
              const phi = controls.getPolarAngle()
              // Default azimuthal (theta) is 0, default polar (phi) is PI/2
              const isDefault = Math.abs(theta) < 0.005 && Math.abs(phi - Math.PI / 2) < 0.005
              const nextRotated = !isDefault
              setIsRotated((prev) => {
                if (prev !== nextRotated) return nextRotated
                return prev
              })
            }
          }}
        />
        <CameraController controlsRef={controlsRef} />
        {isExporting && <ExportFrameCapturer />}
      </Canvas>

      {/* Reset Rotation Button */}
      <AnimatePresence>
        {!isExporting && isRotated && (
          <motion.button
            key="reset-rotation"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={() => {
              controlsRef.current?.reset()
              setIsRotated(false)
            }}
            className={cn(
              "absolute z-20 flex items-center justify-center backdrop-blur-md transition-all shadow-md",
              expanded 
                ? "top-3 left-3 h-9 w-9 rounded-xl" 
                : "bottom-3 left-3 h-8 w-8 rounded-lg",
              darkBg
                ? "bg-black/20 hover:bg-black/40 text-white/70 hover:text-white border border-white/10"
                : "bg-white/70 hover:bg-white/90 text-black/60 hover:text-black border border-black/10"
            )}
            title="Reset 3D Rotation"
          >
            <RotateCcw className={cn("transition-all", expanded ? "h-4 w-4" : "h-3.5 w-3.5")} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
