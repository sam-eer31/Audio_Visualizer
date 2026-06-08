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
      className="h-full w-full flex flex-col"
      style={{ background: bg.gradient || bg.color }}
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
      <header className="shrink-0 z-20 px-6 sm:px-8 py-5 flex items-center justify-between glass-light">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Music2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight block leading-tight">SonicWave</span>
            <span className="text-[10px] text-muted-foreground leading-none">Audio Visualizer</span>
          </div>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          className="h-10 px-4 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium flex items-center gap-2 hover:bg-primary/20 transition-all"
        >
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Upload Audio</span>
          <span className="sm:hidden">Upload</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".mp3,.wav,.m4a,.ogg,.aac"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f) }}
        />
      </header>

      {/* Main content - fills remaining height */}
      <div className="flex-1 flex flex-col min-h-0 px-6 sm:px-8 pb-6 pt-4">

        {/* ===== MOBILE LAYOUT (below lg) ===== */}
        <div className="flex-1 flex flex-col lg:hidden gap-5 overflow-y-auto min-h-0">
          {/* Preview first */}
          <div className="shrink-0 min-h-[260px]">
            <PreviewBox />
          </div>
          {/* Settings */}
          <div className="glass rounded-2xl p-5 shrink-0">
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
              <div className="glass rounded-2xl flex-1 flex flex-col min-h-0 p-5 overflow-hidden">
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

      <ToastContainer />
    </div>
  )
}
