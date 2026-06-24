export type VisualizationMode =
  | 'line-spectrum'
  | 'spectrum-bars'
  | 'circular-spectrum'
  | 'particle-galaxy'
  | 'audio-sphere'
  | 'wave-tunnel'
  | 'neon-rings'
  | 'futuristic-orb'
  | 'cyber-grid'
  | 'dna-helix'
  | 'starfield'
  | 'audio-terrain'
  | 'heartbeat-line'
  | 'mobius-ribbon'
  | 'laser-web'
  | 'audio-portal'
  | 'quantum-supernova'
  | 'cyber-ribbon'
  | 'equalizer-matrix'

export type PlaybackState = 'idle' | 'playing' | 'paused' | 'stopped'

export type ExportResolution = '720p' | '1080p' | '1440p'
export type ExportQuality = 'low' | 'medium' | 'high'
export type ExportFrameRate = 30 | 60

export interface AudioFile {
  file: File
  name: string
  duration: number
  format: string
  size: number
}

export interface AudioAnalysis {
  frequencyData: Uint8Array
  timeDomainData: Uint8Array
  bass: number
  mid: number
  treble: number
  peak: number
  peakFrequency: number
  isBeat: boolean
}

export interface ColorPreset {
  id: string
  name: string
  colors: [string, string, string]
}

export interface BackgroundPreset {
  id: string
  name: string
  color: string
  gradient?: string
  textColor?: string
}

export interface VisualizerSettings {
  mode: VisualizationMode
  colorPreset: string
  backgroundPreset: string
  sensitivity: number
  fftSize: number
  particleCount: number
  rotationSpeed: number
}

export interface ExportSettings {
  resolution: ExportResolution
  quality: ExportQuality
  frameRate: ExportFrameRate
}

export interface AudioState {
  audioFile: AudioFile | null
  playbackState: PlaybackState
  currentTime: number
  duration: number
  volume: number
}

export interface ExportState {
  isExporting: boolean
  progress: number
  error: string | null
}

export const RESOLUTION_MAP: Record<ExportResolution, { width: number; height: number }> = {
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '1440p': { width: 2560, height: 1440 },
}
