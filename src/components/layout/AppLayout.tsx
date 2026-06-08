import { useCallback, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Music2, Upload } from 'lucide-react'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { PreviewBox } from '@/components/preview/PreviewBox'
import { ExportBar } from '@/components/export/ExportBar'
import { ToastContainer } from '@/components/ui/toast'
import { useAudioStore } from '@/stores/audioStore'
import { useAudioControls } from '@/hooks/useAudioControls'
import { useUIStore } from '@/stores/uiStore'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { BACKGROUND_PRESETS } from '@/lib/constants'

export function AppLayout() {
  const audioFile = useAudioStore((s) => s.audioFile)
  const expanded = useUIStore((s) => s.expanded)
  const backgroundPreset = useVisualizerStore((s) => s.backgroundPreset)
  const { loadFile } = useAudioControls()
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const bg = BACKGROUND_PRESETS.find((b) => b.id === backgroundPreset) || BACKGROUND_PRESETS[0]

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) loadFile(file)
  }, [loadFile])

  // Expanded mode = fullscreen preview
  if (expanded && audioFile) {
    return (
      <div className="h-full w-full relative" style={{ background: bg.gradient || bg.color }}>
        <PreviewBox />
        <ToastContainer />
      </div>
    )
  }

  return (
    <div
      className="h-full w-full flex flex-col bg-background"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-primary/10 backdrop-blur-sm flex items-center justify-center pointer-events-none"
          >
            <div className="text-center">
              <Upload className="h-10 w-10 text-primary mx-auto mb-2" />
              <p className="text-base font-semibold">Drop audio file here</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="shrink-0 z-20 px-6 sm:px-8 flex items-center glass-light" style={{ paddingTop: '20px', paddingBottom: '20px' }}>
        <div className="flex items-center" style={{ gap: '14px' }}>
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Music2 className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight leading-none">SonicWave</span>
            <span className="text-[11px] text-muted-foreground mt-1 leading-none">Audio Visualizer</span>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".mp3,.wav,.m4a,.ogg,.aac"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f) }}
        />
      </header>

      {/* Main content - fills remaining height */}
      <div className="flex-1 flex flex-col min-h-0 px-6 sm:px-8" style={{ paddingTop: '24px', paddingBottom: '20px' }}>

        {/* ===== MOBILE LAYOUT (below lg) ===== */}
        <div className="flex-1 flex flex-col lg:hidden gap-5 overflow-y-auto min-h-0">
          {/* Preview first */}
          <div className="shrink-0 min-h-[260px]">
            <PreviewBox />
          </div>
          {/* Settings */}
          <div className="glass rounded-2xl shrink-0" style={{ padding: '20px' }}>
            <SettingsPanel />
          </div>
          {/* Export at the very bottom */}
          {audioFile && (
            <div className="shrink-0">
              <ExportBar />
            </div>
          )}
        </div>

        {/* ===== DESKTOP LAYOUT (lg+) ===== */}
        <div className="hidden lg:flex flex-1 flex-col gap-5 min-h-0">
          <div className="flex-1 flex flex-row gap-5 min-h-0">
            {/* Left: Settings */}
            <div className="w-[380px] xl:w-[420px] shrink-0 flex flex-col min-h-0">
              <div className="glass rounded-2xl flex-1 flex flex-col min-h-0 overflow-hidden" style={{ padding: '20px' }}>
                <SettingsPanel />
              </div>
            </div>
            {/* Right: Preview */}
            <div className="flex-1 min-w-0 flex flex-col min-h-0">
              <PreviewBox />
            </div>
          </div>
          {/* Export below both columns */}
          {audioFile && (
            <div className="shrink-0">
              <ExportBar />
            </div>
          )}
        </div>

      </div>

      {/* Footer */}
      <footer className="shrink-0 px-6 sm:px-8 flex items-center justify-between border-t border-white/[0.05]" style={{ paddingTop: '14px', paddingBottom: '14px' }}>
        <div className="flex items-center" style={{ gap: '8px' }}>
          <div className="h-5 w-5 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Music2 className="h-2.5 w-2.5 text-white" />
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground/80">SonicWave</span>
        </div>
        <p className="text-[10px] text-muted-foreground/40">&copy; {new Date().getFullYear()} SonicWave. All rights reserved.</p>
      </footer>

      <ToastContainer />
    </div>
  )
}
