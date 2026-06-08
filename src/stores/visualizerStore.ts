import { create } from 'zustand'
import type { VisualizationMode } from '@/types'

interface VisualizerStore {
  mode: VisualizationMode
  colorPreset: string
  backgroundPreset: string
  sensitivity: number
  fftSize: number
  particleCount: number
  glowIntensity: number
  rotationSpeed: number
  setMode: (mode: VisualizationMode) => void
  setColorPreset: (preset: string) => void
  setBackgroundPreset: (preset: string) => void
  setSensitivity: (val: number) => void
  setFftSize: (val: number) => void
  setParticleCount: (val: number) => void
  setGlowIntensity: (val: number) => void
  setRotationSpeed: (val: number) => void
  resetSettings: () => void
}

export const useVisualizerStore = create<VisualizerStore>((set) => ({
  mode: 'spectrum-bars',
  colorPreset: 'electric',
  backgroundPreset: 'deep-space',
  sensitivity: 1.5,
  fftSize: 2048,
  particleCount: 2000,
  glowIntensity: 0.8,
  rotationSpeed: 0.5,
  setMode: (mode) => set({ mode }),
  setColorPreset: (preset) => set({ colorPreset: preset }),
  setBackgroundPreset: (preset) => set({ backgroundPreset: preset }),
  setSensitivity: (val) => set({ sensitivity: val }),
  setFftSize: (val) => set({ fftSize: val }),
  setParticleCount: (val) => set({ particleCount: val }),
  setGlowIntensity: (val) => set({ glowIntensity: val }),
  setRotationSpeed: (val) => set({ rotationSpeed: val }),
  resetSettings: () =>
    set({
      sensitivity: 1.5,
      fftSize: 2048,
      particleCount: 2000,
      glowIntensity: 0.8,
      rotationSpeed: 0.5,
    }),
}))
