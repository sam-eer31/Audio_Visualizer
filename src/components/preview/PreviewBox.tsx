import { motion, AnimatePresence } from 'framer-motion'
import { Expand, Shrink, Upload, Play, Pause, Square, Volume2, VolumeX, FileAudio, Loader2, Repeat } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useAudioStore } from '@/stores/audioStore'
import { useAudioControls } from '@/hooks/useAudioControls'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { formatTime } from '@/utils/audioUtils'
import { VisualizerCanvas } from '@/components/visualizers/VisualizerCanvas'
import { BACKGROUND_PRESETS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useRef, useState } from 'react'
import { useExportStore } from '@/stores/exportStore'

function isColorDark(hex: string): boolean {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance < 0.5
}

export function PreviewBox() {
  const { expanded, setExpanded } = useUIStore()
  const audioFile = useAudioStore((s) => s.audioFile)
  const backgroundPreset = useVisualizerStore((s) => s.backgroundPreset)
  const bg = BACKGROUND_PRESETS.find((b) => b.id === backgroundPreset) || BACKGROUND_PRESETS[0]
  const darkBg = bg.textColor ? false : isColorDark(bg.color)
  const isLoading = useAudioStore((s) => s.isLoading)

  const isExporting = useExportStore((s) => s.isExporting)
  const exportSnapshot = useExportStore((s) => s.exportSnapshot)

  return (
    <AnimatePresence>
      {expanded ? (
        <motion.div
          key="expanded"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50"
          style={{ background: bg.gradient || bg.color }}
        >
          {audioFile && (
            <>
              <div className={cn("w-full h-full transition-opacity duration-300", isExporting && "opacity-0 pointer-events-none")}>
                <VisualizerCanvas />
              </div>
              {isExporting && exportSnapshot && (
                <img 
                  src={exportSnapshot} 
                  alt="Export Preview Snapshot" 
                  className="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none"
                />
              )}
            </>
          )}
          <div className="absolute inset-x-0 bottom-0 z-10">
            <PlayerBar />
          </div>
          <button
            onClick={() => setExpanded(false)}
            className={cn(
              "absolute top-3 right-3 z-20 h-9 w-9 rounded-xl flex items-center justify-center backdrop-blur-md transition-all shadow-md",
              darkBg
                ? "bg-black/20 hover:bg-black/40 text-white/70 hover:text-white border border-white/10"
                : "bg-white/70 hover:bg-white/90 text-black/60 hover:text-black border border-black/10"
            )}
          >
            <Shrink className="h-4 w-4" />
          </button>
          {isLoading && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-[4px] z-40 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
              <p className="text-xs font-semibold text-white/90 uppercase tracking-wider">Loading audio...</p>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          key="box"
          className="h-full w-full flex flex-col"
        >
          {/* Preview container */}
          <div
            className="relative flex-1 rounded-2xl overflow-hidden min-h-0"
            style={{
              background: bg.gradient || bg.color,
              color: bg.textColor || (darkBg ? '#ffffff' : '#0f172a'),
              borderColor: darkBg ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
          >
            {audioFile ? (
              <>
                <div className={cn("w-full h-full transition-opacity duration-300", isExporting && "opacity-0 pointer-events-none")}>
                  <VisualizerCanvas />
                </div>
                {isExporting && exportSnapshot && (
                  <img 
                    src={exportSnapshot} 
                    alt="Export Preview Snapshot" 
                    className="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none"
                  />
                )}
                {/* Expand button */}
                {!isExporting && (
                  <button
                    onClick={() => setExpanded(true)}
                    className={cn(
                      "absolute bottom-3 right-3 z-10 h-8 w-8 rounded-lg flex items-center justify-center backdrop-blur-md transition-all shadow-md",
                      darkBg
                        ? "bg-black/20 hover:bg-black/40 text-white/70 hover:text-white border border-white/10"
                        : "bg-white/70 hover:bg-white/90 text-black/60 hover:text-black border border-black/10"
                    )}
                  >
                    <Expand className="h-3.5 w-3.5" />
                  </button>
                )}
              </>
            ) : (
              <EmptyUploadBox dark={darkBg} />
            )}

            {isLoading && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-[4px] z-30 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-7 w-7 text-primary animate-spin" />
                <p className="text-xs font-semibold text-white/90 uppercase tracking-wider">Loading audio...</p>
              </div>
            )}
          </div>

          {/* Player controls below preview - desktop only */}
          {audioFile && (
            <div className="hidden lg:block mt-4 sm:mt-5 shrink-0">
              <PlayerBar />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function EmptyUploadBox({ dark }: { dark: boolean }) {
  const { loadFile } = useAudioControls()
  const fileRef = useRef<HTMLInputElement>(null)
  const [isLoadingSample, setIsLoadingSample] = useState(false)
  const addToast = useUIStore((s) => s.addToast)

  const handleLoadSample = async () => {
    try {
      setIsLoadingSample(true)
      const response = await fetch('/sample.mp3')
      if (!response.ok) throw new Error('Sample audio file not found on server')
      const blob = await response.blob()
      const file = new File([blob], 'sample.mp3', { type: 'audio/mpeg' })
      await loadFile(file)
    } catch (err) {
      console.error(err)
      addToast('Failed to load sample audio.', 'error')
    } finally {
      setIsLoadingSample(false)
    }
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-3.5 sm:p-6 md:p-8">
      <div
        className={cn(
          "w-full max-w-[320px] flex flex-col items-center rounded-2xl border-2 border-dashed transition-colors cursor-pointer p-4 sm:p-6 md:p-8",
          dark ? "border-white/[0.08] hover:border-primary/30" : "border-black/[0.12] hover:border-primary/40"
        )}
        onClick={() => fileRef.current?.click()}
      >
        {/* Icon */}
        <div
          className={cn(
            "rounded-2xl flex items-center justify-center shrink-0 mb-3 sm:mb-5 w-11 h-11 sm:w-16 sm:h-16",
            dark
              ? "bg-gradient-to-br from-rose-500/10 to-pink-600/10 border border-rose-500/[0.08]"
              : "bg-gradient-to-br from-rose-500/10 to-pink-600/10 border border-rose-500/20"
          )}
        >
          <Upload className={cn("h-5 w-5 sm:h-7 sm:w-7", dark ? "text-rose-400/60" : "text-rose-500/70")} />
        </div>

        {/* Text */}
        <p className="text-[12px] sm:text-[14px] font-semibold text-center leading-tight" style={{ color: dark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)' }}>Drop your audio file here</p>
        <p className="text-[10px] sm:text-[11px] text-center mt-1 sm:mt-1.5" style={{ color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)' }}>or click anywhere in this box to browse</p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-3 sm:mt-5 w-full justify-center">
          <button
            onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
            className="w-full sm:w-auto rounded-xl bg-primary text-primary-foreground text-[10px] sm:text-[12px] font-semibold flex items-center justify-center shadow-lg shadow-primary/20 hover:shadow-primary/35 hover:scale-[1.02] transition-all active:scale-[0.97] px-4 py-1.5 sm:px-5.5 sm:py-2.5 gap-1.5 sm:gap-2"
          >
            <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Choose File
          </button>
          
          <button
            onClick={async (e) => {
              e.stopPropagation()
              await handleLoadSample()
            }}
            disabled={isLoadingSample}
            className={cn(
              "w-full sm:w-auto rounded-xl text-[10px] sm:text-[12px] font-semibold flex items-center justify-center border transition-all active:scale-[0.97] px-4 py-1.5 sm:px-5.5 sm:py-2.5 gap-1.5 sm:gap-2",
              dark
                ? "bg-white/5 hover:bg-white/10 text-white/90 border-white/10 hover:border-white/20"
                : "bg-black/5 hover:bg-black/10 text-black/90 border-black/10 hover:border-black/20"
            )}
          >
            {isLoadingSample ? (
              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-muted-foreground" />
            ) : (
              <FileAudio className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-500/80" />
            )}
            Use Sample Audio
          </button>
        </div>

        {/* Supported formats */}
        <div className="hidden sm:flex items-center gap-1.5 mt-4">
          {['MP3', 'WAV', 'M4A', 'OGG', 'AAC'].map((f) => (
            <span
              key={f}
              className="text-[9px] font-medium uppercase tracking-wider rounded-md border"
              style={{
                padding: '3px 7px',
                background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
                color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
              }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".mp3,.wav,.m4a,.ogg,.aac"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f) }}
      />
    </div>
  )
}

export function PlayerBar() {
  const { audioFile, playbackState, currentTime, duration, volume, loop, play, pause, stop, seek, setVolume, toggleLoop } = useAudioControls()
  const expanded = useUIStore((s) => s.expanded)
  const theme = useUIStore((s) => s.theme)
  const darkBg = theme === 'dark'

  const progressBarRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const [isScrubbing, setIsScrubbing] = useState(false)

  if (!audioFile) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const updateSeek = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration === 0) return
    const rect = progressBarRef.current.getBoundingClientRect()
    const clientX = Math.max(rect.left, Math.min(e.clientX, rect.right))
    const pct = (clientX - rect.left) / rect.width
    seek(pct * duration)
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return
    isDraggingRef.current = true
    setIsScrubbing(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    updateSeek(e)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return
    updateSeek(e)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false
      setIsScrubbing(false)
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch (err) {
        // ignore
      }
    }
  }

  return (
    <div
      style={{
        background: darkBg ? 'rgba(8, 8, 12, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(24px) saturate(1.4)',
        ...(expanded ? { marginLeft: '16px', marginRight: '16px', marginBottom: '16px' } : {})
      }}
      className={cn(
        "rounded-2xl border",
        expanded 
          ? "p-3.5 sm:p-5" 
          : "py-2.5 px-3.5 sm:py-[18px] sm:px-[22px]",
        darkBg ? "border-white/[0.06]" : "border-black/[0.08]"
      )}
    >

      {/* Seek bar */}
      <div className="mb-2 sm:mb-3">
        <div 
          ref={progressBarRef}
          className="relative w-full py-2.5 cursor-pointer group touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Visual Track */}
          <div className={cn("relative w-full h-[4px] rounded-full overflow-hidden", darkBg ? "bg-white/[0.06]" : "bg-black/[0.08]")}>
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Handle indicator - visible on hover or actively scrubbing */}
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-primary shadow-lg shadow-primary/40 transition-all pointer-events-none",
              isScrubbing ? "opacity-100 scale-110" : "opacity-0 group-hover:opacity-100"
            )}
            style={{ left: `${progress}%`, marginLeft: '-7px' }}
          />
        </div>
        <div className="flex justify-between mt-1 sm:mt-1.5">
          <span className="text-[10px] font-mono tabular-nums" style={{ color: darkBg ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>{formatTime(currentTime)}</span>
          <span className="text-[10px] font-mono tabular-nums" style={{ color: darkBg ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)' }}>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* File info */}
        <div className="flex items-center min-w-0 flex-1 gap-2 sm:gap-2.5">
          <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-primary/[0.08] border border-primary/10 flex items-center justify-center shrink-0">
            <FileAudio className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary/80" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-[12px] font-semibold truncate leading-tight" style={{ color: darkBg ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)' }}>{audioFile.name}</p>
            <p className="text-[9px] sm:text-[10px] leading-tight mt-0.5 uppercase tracking-wider" style={{ color: darkBg ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }}>{audioFile.format}</p>
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={toggleLoop}
            className={cn(
              "h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center transition-all",
              loop
                ? "text-primary hover:bg-primary/10"
                : (darkBg
                    ? "text-white/30 hover:text-white/70 hover:bg-white/[0.06]"
                    : "text-black/30 hover:text-black/60 hover:bg-black/[0.04]")
            )}
            title={loop ? "Disable Loop" : "Enable Loop"}
          >
            <Repeat className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
          <button
            onClick={stop}
            disabled={playbackState === 'idle' || playbackState === 'stopped'}
            className={cn(
              "h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-20",
              darkBg
                ? "text-white/30 hover:text-white/70 hover:bg-white/[0.06] disabled:hover:bg-transparent disabled:hover:text-white/30"
                : "text-black/30 hover:text-black/60 hover:bg-black/[0.04] disabled:hover:bg-transparent disabled:hover:text-black/30"
            )}
            title="Stop"
          >
            <Square className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>
          <button
            onClick={playbackState === 'playing' ? pause : play}
            className="h-8.5 w-8.5 sm:h-11 sm:w-11 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.03] transition-all active:scale-95 shrink-0"
          >
            <AnimatePresence mode="wait">
              {playbackState === 'playing' ? (
                <motion.div key="pause" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="flex items-center justify-center">
                  <Pause className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5" />
                </motion.div>
              ) : (
                <motion.div key="play" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="flex items-center justify-center">
                  <Play className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 ml-0.5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
          <div className="w-2 sm:w-8" />
        </div>

        {/* Volume */}
        <div className="hidden sm:flex items-center flex-1 justify-end max-w-[110px]" style={{ gap: '8px' }}>
          <button
            onClick={() => setVolume(volume > 0 ? 0 : 0.75)}
            className={cn("transition-colors shrink-0", darkBg ? "text-white/30 hover:text-white/60" : "text-black/30 hover:text-black/50")}
          >
            {volume === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
          <div className={cn("flex-1 relative h-[3px] rounded-full cursor-pointer", darkBg ? "bg-white/[0.06]" : "bg-black/[0.06]")}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const pct = (e.clientX - rect.left) / rect.width
              setVolume(Math.max(0, Math.min(1, pct)))
            }}
          >
            <div
              className={cn("absolute inset-y-0 left-0 rounded-full", darkBg ? "bg-white/30" : "bg-black/25")}
              style={{ width: `${volume * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
