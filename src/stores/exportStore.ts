import { create } from 'zustand'
import type { ExportResolution, ExportQuality, ExportFrameRate } from '@/types'

interface ExportStore {
  resolution: ExportResolution
  quality: ExportQuality
  frameRate: ExportFrameRate
  isExporting: boolean
  progress: number
  error: string | null
  setResolution: (res: ExportResolution) => void
  setQuality: (q: ExportQuality) => void
  setFrameRate: (fps: ExportFrameRate) => void
  setIsExporting: (val: boolean) => void
  setProgress: (val: number) => void
  setError: (err: string | null) => void
  reset: () => void
}

export const useExportStore = create<ExportStore>((set) => ({
  resolution: '1080p',
  quality: 'high',
  frameRate: 60,
  isExporting: false,
  progress: 0,
  error: null,
  setResolution: (res) => set({ resolution: res }),
  setQuality: (q) => set({ quality: q }),
  setFrameRate: (fps) => set({ frameRate: fps }),
  setIsExporting: (val) => set({ isExporting: val }),
  setProgress: (val) => set({ progress: val }),
  setError: (err) => set({ error: err }),
  reset: () => set({ isExporting: false, progress: 0, error: null }),
}))
