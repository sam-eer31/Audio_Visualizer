import { useCallback, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Music2, Upload, Sun, Moon } from 'lucide-react'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { PreviewBox, PlayerBar } from '@/components/preview/PreviewBox'
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

      <header className="shrink-0 z-20 app-layout-padding flex items-center justify-between glass-light h-12 sm:h-14">
        <div className="flex items-center h-full">
          <img src="/logo.png" alt="Audrix Logo" className="h-7 sm:h-9 w-auto object-contain block" />
        </div>

        <div className="flex items-center" style={{ gap: '12px' }}>
          {/* Upload Song Button */}
          {audioFile && (
            <button
              onClick={() => fileRef.current?.click()}
              className="relative h-9 px-3 sm:px-3.5 rounded-xl border border-white/[0.08] flex items-center justify-center gap-1.5 overflow-hidden transition-all hover:scale-[1.03] active:scale-95 text-[11px] font-semibold"
              style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
              title="Upload other song"
            >
              <Upload className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
              <span className="hidden sm:inline">Change Song</span>
            </button>
          )}

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
                  <Moon className="h-4 w-4 text-rose-300" />
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
      <div className="flex-1 flex flex-col min-h-0 app-layout-padding pt-3 sm:pt-6 pb-5">

        {/* ===== MOBILE LAYOUT (below lg) ===== */}
        <div className="flex-1 flex flex-col lg:hidden gap-3.5 overflow-y-auto min-h-0 relative">
          {/* Preview first - Sticky on mobile */}
          <div className="shrink-0 sticky top-0 z-30 bg-background pt-1 pb-3 -mt-1 -mb-3">
            <div className="min-h-[200px] h-[30vh] max-h-[300px]">
              <PreviewBox />
            </div>
          </div>

          {/* Audio Controller - Scrollable on mobile */}
          {audioFile && (
            <div className="shrink-0">
              <PlayerBar />
            </div>
          )}

          {/* Settings */}
          <div className="glass rounded-2xl shrink-0 p-4 sm:p-5">
            <SettingsPanel />
          </div>
          {/* Export at the very bottom */}
          {audioFile && (
            <div className="shrink-0">
              <ExportBar />
            </div>
          )}

          {/* Mobile Footer (scrollable, hidden on desktop because parent is lg:hidden) */}
          <footer className={cn("shrink-0 border-t mt-4 pt-5 pb-2", theme === 'dark' ? 'border-white/[0.06]' : 'border-black/[0.06]')}>
            <div className="flex flex-col items-center justify-between gap-3 text-center">
              <div className="flex items-center justify-center">
                <img src="/logo.png" alt="Audrix Logo" className="h-8 w-auto object-contain" />
              </div>
              <div className="flex flex-col gap-1.5 items-center">
                <span className="text-[10px] text-muted-foreground/40 font-medium">Built with React & Three.js</span>
                <span className="text-[10px] text-muted-foreground/40 font-medium">&copy; {new Date().getFullYear()} Audrix</span>
              </div>
            </div>
          </footer>
        </div>

        {/* ===== DESKTOP LAYOUT (lg+) ===== */}
        <div className="hidden lg:flex flex-1 flex-col gap-5 min-h-0">
          <div className="flex-1 flex flex-row gap-5 min-h-0">
            {/* Left: Settings */}
            <div className="w-[380px] xl:w-[420px] shrink-0 flex flex-col min-h-0">
              <div className="glass rounded-2xl flex-1 flex flex-col min-h-0 overflow-hidden p-5">
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
      <footer className={cn("hidden lg:block shrink-0 border-t app-layout-padding", theme === 'dark' ? 'border-white/[0.06]' : 'border-black/[0.06]')} style={{ paddingTop: '20px', paddingBottom: '20px' }}>
        <div className="flex flex-col sm:flex-row items-center justify-between" style={{ gap: '12px' }}>
          <div className="flex items-center">
            <img src="/logo.png" alt="Audrix Logo" className="h-8 sm:h-10 w-auto object-contain" />
          </div>
          <div className="flex items-center" style={{ gap: '16px' }}>
            <span className="text-[10px] text-muted-foreground/40">Built with React & Three.js</span>
            <span className="text-[10px] text-muted-foreground/30">|</span>
            <span className="text-[10px] text-muted-foreground/40">&copy; {new Date().getFullYear()} Audrix</span>
          </div>
        </div>
      </footer>

      <ToastContainer />
    </div>
  )
}
