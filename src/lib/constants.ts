import type { VisualizationMode, ColorPreset, BackgroundPreset } from '@/types'
import {
  BarChart3,
  Circle,
  Sparkles,
  Globe,
  Waves,
  Disc3,
  Atom,
  Grid3x3,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { LucideProps } from 'lucide-react'

export const VISUALIZATION_MODES: {
  id: VisualizationMode
  name: string
  description: string
  icon: ComponentType<LucideProps>
}[] = [
  { id: 'spectrum-bars', name: 'Spectrum Bars', description: 'Modern glowing bars', icon: BarChart3 },
  { id: 'circular-spectrum', name: 'Circular Spectrum', description: 'Radial visualizer', icon: Circle },
  { id: 'particle-galaxy', name: 'Particle Galaxy', description: 'Reactive particles', icon: Sparkles },
  { id: 'audio-sphere', name: 'Audio Sphere', description: '3D deforming sphere', icon: Globe },
  { id: 'wave-tunnel', name: 'Wave Tunnel', description: 'Waveform tunnel', icon: Waves },
  { id: 'neon-rings', name: 'Neon Rings', description: 'Pulsing rings', icon: Disc3 },
  { id: 'futuristic-orb', name: 'Futuristic Orb', description: 'Reactive orb', icon: Atom },
  { id: 'cyber-grid', name: 'Cyber Grid', description: 'Grid distortion', icon: Grid3x3 },
]

export const COLOR_PRESETS: ColorPreset[] = [
  { id: 'neon-blue', name: 'Neon Blue', colors: ['#00d4ff', '#0099ff', '#0055ff'] },
  { id: 'sunset', name: 'Sunset', colors: ['#ff6b35', '#ff2d87', '#c800ff'] },
  { id: 'aurora', name: 'Aurora', colors: ['#00ff87', '#00d4ff', '#c800ff'] },
  { id: 'fire', name: 'Fire', colors: ['#ff4500', '#ff8c00', '#ffd700'] },
  { id: 'cyberpunk', name: 'Cyberpunk', colors: ['#ff00ff', '#00ffff', '#ff0080'] },
  { id: 'ocean', name: 'Ocean', colors: ['#006994', '#00b4d8', '#90e0ef'] },
]

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { id: 'void', name: 'Void', color: '#000000' },
  { id: 'deep-space', name: 'Deep Space', color: '#0a0a1a', gradient: 'radial-gradient(ellipse at center, #0a0a2e 0%, #000000 100%)' },
  { id: 'midnight', name: 'Midnight', color: '#0d1117', gradient: 'linear-gradient(180deg, #0d1117 0%, #161b22 100%)' },
  { id: 'nebula', name: 'Nebula', color: '#0f0020', gradient: 'radial-gradient(ellipse at 30% 50%, #1a0033 0%, #0f0020 50%, #000000 100%)' },
  { id: 'charcoal', name: 'Charcoal', color: '#1a1a2e', gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' },
]

export const FFT_SIZES = [256, 512, 1024, 2048, 4096, 8192] as const

export const SUPPORTED_FORMATS = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/x-m4a', 'audio/aac']
export const SUPPORTED_EXTENSIONS = '.mp3,.wav,.m4a,.ogg,.aac'

export const KEYBOARD_SHORTCUTS = {
  SPACE: 'Space',
  RESET: 'r',
  FULLSCREEN: 'f',
  EXPORT: 'e',
} as const
