import { motion, AnimatePresence } from 'framer-motion'
import { Expand, Shrink, Upload, Music2, Play, Pause, Square, Volume2, VolumeX, FileAudio } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useAudioStore } from '@/stores/audioStore'
import { useAudioControls } from '@/hooks/useAudioControls'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { formatTime } from '@/utils/audioUtils'
import { VisualizerCanvas } from '@/components/visualizers/VisualizerCanvas'
import { BACKGROUND_PRESETS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useRef } from 'react'

export function PreviewBox() {
  const { expanded, setExpanded } = useUIStore()
  const audioFile = useAudioStore((s) => s.audioFile)
  const backgroundPreset = useVisualizerStore((s) => s.backgroundPreset)
  const bg = BACKGROUND_PRESETS.find((b) => b.id === backgroundPreset) || BACKGROUND_PRESETS[0]

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
          {audioFile && <VisualizerCanvas />}
          <div className="absolute inset-x-0 bottom-0 z-10">
            <PlayerBar />
          </div>
          <button
            onClick={() => setExpanded(false)}
            className="absolute top-3 right-3 z-20 h-9 w-9 rounded-xl glass flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            <Shrink className="h-4 w-4" />
          </button>
        </motion.div>
      ) : (
        <motion.div
          key="box"
          layout
          className="h-full w-full flex flex-col"
        >
          {/* Preview container */}
          <div
            className="relative flex-1 rounded-2xl overflow-hidden border border-white/8 min-h-0"
            style={{ background: bg.gradient || bg.color }}
          >
            {audioFile ? (
              <>
                <VisualizerCanvas />
                {/* Expand button */}
                <button
                  onClick={() => setExpanded(true)}
                  className="absolute top-2 right-2 z-10 h-8 w-8 rounded-lg glass flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Expand className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <EmptyUploadBox />
            )}
          </div>

          {/* Player controls below preview */}
          {audioFile && (
            <div className="mt-3 shrink-0" style={{ paddingLeft: '2px', paddingRight: '2px' }}>
              <PlayerBar />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function EmptyUploadBox() {
  const { loadFile } = useAudioControls()
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-indigo-500/10 flex items-center justify-center">
        <Music2 className="h-7 w-7 text-indigo-400/70" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground">Upload audio to preview</p>
        <p className="text-[11px] text-muted-foreground/50 mt-1">Drag & drop or choose a file</p>
      </div>
      <button
        onClick={() => fileRef.current?.click()}
        className="h-10 px-6 rounded-xl bg-primary text-primary-foreground text-[12px] font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.97]"
      >
        <Upload className="h-4 w-4" />
        Choose File
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".mp3,.wav,.m4a,.ogg,.aac"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f) }}
      />
      <div className="flex gap-1 mt-1">
        {['MP3', 'WAV', 'M4A', 'OGG'].map((f) => (
          <span key={f} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">{f}</span>
        ))}
      </div>
    </div>
  )
}

function PlayerBar() {
  const { audioFile, playbackState, currentTime, duration, volume, play, pause, stop, seek, setVolume } = useAudioControls()
  const expanded = useUIStore((s) => s.expanded)

  if (!audioFile) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={cn(
      "rounded-2xl border border-white/[0.06]",
      expanded ? "mx-4 mb-4 p-5" : "p-4 sm:p-5"
    )} style={{ background: 'rgba(8, 8, 12, 0.85)', backdropFilter: 'blur(24px) saturate(1.4)' }}>

      {/* Seek bar */}
      <div className="mb-3">
        <div className="relative w-full h-[4px] rounded-full bg-white/[0.06] overflow-hidden cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const pct = (e.clientX - rect.left) / rect.width
            seek(pct * (duration || 0))
          }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-primary shadow-lg shadow-primary/40 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${progress}%`, marginLeft: '-6px' }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] font-mono text-muted-foreground/60 tabular-nums">{formatTime(currentTime)}</span>
          <span className="text-[10px] font-mono text-muted-foreground/40 tabular-nums">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center" style={{ gap: '12px' }}>
        {/* File info */}
        <div className="flex items-center min-w-0 flex-1" style={{ gap: '10px' }}>
          <div className="h-9 w-9 rounded-xl bg-primary/[0.08] border border-primary/10 flex items-center justify-center shrink-0">
            <FileAudio className="h-4 w-4 text-primary/80" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold truncate leading-tight">{audioFile.name}</p>
            <p className="text-[10px] text-muted-foreground/50 leading-tight mt-0.5 uppercase tracking-wider">{audioFile.format}</p>
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center" style={{ gap: '8px' }}>
          <button
            onClick={stop}
            disabled={playbackState === 'idle' || playbackState === 'stopped'}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-white/30"
          >
            <Square className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={playbackState === 'playing' ? pause : play}
            className="h-11 w-11 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.03] transition-all active:scale-95"
          >
            <AnimatePresence mode="wait">
              {playbackState === 'playing' ? (
                <motion.div key="pause" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Pause className="h-4.5 w-4.5" />
                </motion.div>
              ) : (
                <motion.div key="play" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Play className="h-4.5 w-4.5 ml-0.5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
          <div className="w-8" />
        </div>

        {/* Volume */}
        <div className="hidden sm:flex items-center flex-1 justify-end max-w-[110px]" style={{ gap: '8px' }}>
          <button
            onClick={() => setVolume(volume > 0 ? 0 : 0.75)}
            className="text-white/30 hover:text-white/60 transition-colors shrink-0"
          >
            {volume === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
          <div className="flex-1 relative h-[3px] rounded-full bg-white/[0.06] cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const pct = (e.clientX - rect.left) / rect.width
              setVolume(Math.max(0, Math.min(1, pct)))
            }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/30"
              style={{ width: `${volume * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
