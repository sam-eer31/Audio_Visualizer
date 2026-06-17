import { useCallback, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Music2, Upload, Sun, Moon, Loader2, Code2 } from 'lucide-react'
import { useExportStore } from '@/stores/exportStore'

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { PreviewBox, PlayerBar } from '@/components/preview/PreviewBox'
import { ExportBar } from '@/components/export/ExportBar'
import { ApiModal } from '@/components/embed/ApiModal'
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
  const [isApiModalOpen, setIsApiModalOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const isExporting = useExportStore((s) => s.isExporting)
  const progress = useExportStore((s) => s.progress)
  const cancelExport = useExportStore((s) => s.cancelExport)

  // Lock body scroll during export
  useEffect(() => {
    if (isExporting) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isExporting])

  const bg = BACKGROUND_PRESETS.find((b) => b.id === backgroundPreset) || BACKGROUND_PRESETS[0]

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (isExporting) return
    const file = e.dataTransfer.files[0]
    if (file) loadFile(file)
  }, [loadFile, isExporting])

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
      onDragOver={(e) => {
        if (isExporting) return
        e.preventDefault()
        setIsDragging(true)
      }}
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
              disabled={isExporting}
              className={cn(
                "relative h-9 px-3 sm:px-3.5 rounded-xl border border-white/[0.08] flex items-center justify-center gap-1.5 overflow-hidden transition-all text-[11px] font-semibold",
                isExporting 
                  ? "opacity-40 cursor-not-allowed pointer-events-none" 
                  : "hover:scale-[1.03] active:scale-95"
              )}
              style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
              title={isExporting ? "Disabled during export" : "Upload other song"}
            >
              <Upload className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
              <span className="hidden sm:inline">Change Song</span>
            </button>
          )}

          {/* API / Embed Button */}
          <button
            onClick={() => setIsApiModalOpen(true)}
            className="relative h-9 px-3 sm:px-3.5 rounded-xl border border-white/[0.08] flex items-center justify-center gap-1.5 overflow-hidden transition-all hover:scale-[1.03] active:scale-95 text-[11px] font-semibold"
            style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
            title="Developer API & Embed"
          >
            <Code2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
            <span className="hidden sm:inline">API</span>
          </button>

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
      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Main Content Area - blurred when exporting */}
        <div className={cn(
          "flex-1 flex flex-col min-h-0 app-layout-padding pt-3 sm:pt-6 pb-5",
          isExporting && "blur-md pointer-events-none select-none overflow-hidden"
        )}>
          {/* ===== MOBILE LAYOUT (below lg) ===== */}
          <div className={cn(
            "flex-1 flex flex-col lg:hidden gap-3.5 min-h-0 relative",
            isExporting ? "overflow-hidden" : "overflow-y-auto"
          )}>
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
            <footer className={cn("shrink-0 border-t mt-6 pt-5 pb-3", theme === 'dark' ? 'border-white/[0.06]' : 'border-black/[0.06]')}>
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex flex-col items-center gap-1">
                  <img src="/logo.png" alt="Audrix Logo" className="h-8 w-auto object-contain" />
                  <p className="text-[9px] text-muted-foreground/50 font-medium">Interactive 3D audio visualization in your browser.</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <a 
                    href="https://github.com/sam-eer31" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 hover:text-primary transition-colors cursor-pointer"
                  >
                    <GithubIcon className="h-3.5 w-3.5" />
                    <span>GitHub</span>
                  </a>
                  <span className="text-muted-foreground/20 text-[9px]">•</span>
                  <a 
                    href="https://github.com/sam-eer31/Audio_Visualizer" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[10px] text-muted-foreground/60 hover:text-primary transition-colors cursor-pointer"
                  >
                    Source Code
                  </a>
                </div>
                
                <div className={cn("w-full border-t pt-3 flex flex-col items-center gap-1 text-[9px]", theme === 'dark' ? 'border-white/[0.04]' : 'border-black/[0.04]')}>
                  <span className="text-muted-foreground/40">&copy; {new Date().getFullYear()} Audrix. All rights reserved.</span>
                  <span className="text-muted-foreground/30 font-medium">React • Three.js • Tailwind CSS</span>
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

        {/* Modal Overlay */}
        {isExporting && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-[2px] p-4">
            <div className="glass rounded-2xl p-6 sm:p-8 max-w-sm w-full mx-auto flex flex-col items-center text-center shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-200">
              <div className="relative flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              </div>
              
              <h3 className="text-sm sm:text-base font-semibold text-foreground">Exporting Video</h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground/60 mt-1 max-w-[280px]">
                Audrix is rendering and exporting your visualization. Please keep this browser tab active.
              </p>

              {/* Progress bar */}
              <div className="w-full mt-5">
                <div className="flex justify-between items-center text-[10px] font-semibold mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="text-foreground font-mono">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
              </div>

              {/* Cancel button */}
              {cancelExport && (
                <button
                  onClick={cancelExport}
                  className="mt-6 w-full py-2 sm:py-2.5 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold transition-all hover:scale-[1.02] active:scale-95 text-[11px]"
                >
                  Cancel Export
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className={cn("hidden lg:block shrink-0 border-t app-layout-padding py-6 mt-auto", theme === 'dark' ? 'border-white/[0.06]' : 'border-black/[0.06]')}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <img src="/logo.png" alt="Audrix Logo" className="h-8 w-auto object-contain block" />
              <p className="text-[10px] text-muted-foreground/50 font-medium">Interactive 3D audio visualization in your browser.</p>
            </div>
            
            <div className="flex items-center gap-5">
              <a 
                href="https://github.com/sam-eer31" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 hover:text-primary transition-colors cursor-pointer"
              >
                <GithubIcon className="h-3.5 w-3.5" />
                <span>GitHub Profile</span>
              </a>
              <span className="text-muted-foreground/20 text-[10px]">•</span>
              <a 
                href="https://github.com/sam-eer31/Audio_Visualizer" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[11px] text-muted-foreground/60 hover:text-primary transition-colors cursor-pointer"
              >
                Project Source
              </a>
            </div>
          </div>
          
          <div className={cn("border-t pt-4 flex flex-row items-center justify-between text-[10px]", theme === 'dark' ? 'border-white/[0.04]' : 'border-black/[0.04]')}>
            <span className="text-muted-foreground/40">&copy; {new Date().getFullYear()} Audrix. All rights reserved.</span>
            <div className="flex items-center gap-1.5 text-muted-foreground/40 font-medium">
              <span>Built with React</span>
              <span className="text-muted-foreground/25">•</span>
              <span>Three.js</span>
              <span className="text-muted-foreground/25">•</span>
              <span>Tailwind CSS</span>
            </div>
          </div>
        </div>
      </footer>

      <ApiModal isOpen={isApiModalOpen} onClose={() => setIsApiModalOpen(false)} />
      <ToastContainer />
    </div>
  )
}
