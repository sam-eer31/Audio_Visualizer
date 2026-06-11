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
  Dna,
  Star,
  Mountain,
  Activity,
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
  { id: 'dna-helix', name: 'DNA Helix', description: 'Double helix strand', icon: Dna },
  { id: 'starfield', name: 'Starfield', description: 'Hyperspeed stars', icon: Star },
  { id: 'audio-terrain', name: 'Audio Terrain', description: '3D landscape', icon: Mountain },
  { id: 'heartbeat-line', name: 'Heartbeat Line', description: 'Live oscilloscope', icon: Activity },
]

export const COLOR_PRESETS: ColorPreset[] = [
  { id: 'electric', name: 'Electric', colors: ['#FF1F5A', '#FF4D7D', '#FF7DA0'] },
  { id: 'sunset-gold', name: 'Sunset', colors: ['#f97316', '#ef4444', '#ec4899'] },
  { id: 'emerald', name: 'Emerald', colors: ['#10b981', '#06b6d4', '#3b82f6'] },
  { id: 'rose', name: 'Rose', colors: ['#f43f5e', '#e879f9', '#c084fc'] },
  { id: 'arctic', name: 'Arctic', colors: ['#38bdf8', '#818cf8', '#c4b5fd'] },
  { id: 'platinum', name: 'Platinum', colors: ['#e2e8f0', '#94a3b8', '#64748b'] },
]

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { id: 'void', name: 'Void', color: '#000000' },
  { id: 'deep-space', name: 'Deep Space', color: '#050510', gradient: 'radial-gradient(ellipse at 50% 50%, #0a0a2e 0%, #050510 60%, #000000 100%)' },
  { id: 'midnight', name: 'Midnight', color: '#0d1117', gradient: 'linear-gradient(180deg, #0d1117 0%, #161b22 100%)' },
  { id: 'nebula', name: 'Nebula', color: '#0a0015', gradient: 'radial-gradient(ellipse at 30% 40%, #1a0040 0%, #0a0015 50%, #000000 100%)' },
  { id: 'obsidian', name: 'Obsidian', color: '#0c0c0c', gradient: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #0c0c0c 100%)' },
  { id: 'slate-dark', name: 'Slate Dark', color: '#0f172a', gradient: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)' },
  { id: 'slate-light', name: 'Slate Light', color: '#ffffff', textColor: '#0f172a' },
  { id: 'pure-white', name: 'Pure White', color: '#ffffff' },
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
