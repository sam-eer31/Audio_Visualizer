import { useCallback, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Music2, Upload, Sun, Moon } from 'lucide-react'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { PreviewBox } from '@/components/preview/PreviewBox'
import { ExportBar } from '@/components/export/ExportBar'
import { ToastContainer } from '@/components/ui/toast'
import { useAudioStore } from '@/stores/audioStore'
import { useAudioControls } from '@/hooks/useAudioControls'
import { useUIStore } from '@/stores/uiStore'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { BACKGROUND_PRESETS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function AppLayout() {
  const audioFile = useAudioStore((s) => s.audioFile)
  const expanded = useUIStore((s) => s.expanded)
  const theme = useUIStore((s) => s.theme)
  const toggleTheme = useUIStore((s) => s.toggleTheme)
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
      <header className="shrink-0 z-20 px-6 sm:px-8 flex items-center justify-between glass-light" style={{ paddingTop: '20px', paddingBottom: '20px' }}>
        <div className="flex items-center" style={{ gap: '14px' }}>
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Music2 className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight leading-none">SonicWave</span>
            <span className="text-[11px] text-muted-foreground mt-1 leading-none">Audio Visualizer</span>
          </div>
        </div>

        <div className="flex items-center" style={{ gap: '12px' }}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="relative h-9 w-9 rounded-xl border border-white/[0.08] flex items-center justify-center overflow-hidden transition-all hover:scale-[1.05] active:scale-95"
            style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <AnimatePresence mode="wait">
              {theme === 'dark' ? (
                <motion.div
                  key="moon"
                  initial={{ rotate: -90, opacity: 0, scale: 0 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <Moon className="h-4 w-4 text-indigo-300" />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ rotate: 90, opacity: 0, scale: 0 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -90, opacity: 0, scale: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <Sun className="h-4 w-4 text-amber-500" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
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
      <footer className={cn("shrink-0 border-t", theme === 'dark' ? 'border-white/[0.06]' : 'border-black/[0.06]')} style={{ padding: '20px 24px' }}>
        <div className="flex flex-col sm:flex-row items-center justify-between" style={{ gap: '12px' }}>
          <div className="flex items-center" style={{ gap: '10px' }}>
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Music2 className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-bold tracking-tight">SonicWave</span>
              <span className="text-[10px] text-muted-foreground/50 leading-none">Audio Visualizer</span>
            </div>
          </div>
          <div className="flex items-center" style={{ gap: '16px' }}>
            <span className="text-[10px] text-muted-foreground/40">Built with React & Three.js</span>
            <span className="text-[10px] text-muted-foreground/30">|</span>
            <span className="text-[10px] text-muted-foreground/40">&copy; {new Date().getFullYear()} SonicWave</span>
          </div>
        </div>
      </footer>

      <ToastContainer />
    </div>
  )
}
