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
            <div className="mt-2 shrink-0">
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

  if (!audioFile) return null

  return (
    <div className={cn(
      "glass rounded-2xl px-3 pt-2 pb-2.5",
      useUIStore.getState().expanded ? "mx-3 mb-3" : ""
    )}>
      {/* Seek */}
      <div>
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.01}
          value={currentTime}
          onChange={(e) => seek(parseFloat(e.target.value))}
          className="seek-slider w-full"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground -mt-1 px-0.5">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-2 mt-1">
        {/* File info */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileAudio className="h-3 w-3 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium truncate">{audioFile.name}</p>
            <p className="text-[9px] text-muted-foreground">{audioFile.format}</p>
          </div>
        </div>

        {/* Playback buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={stop}
            disabled={playbackState === 'idle' || playbackState === 'stopped'}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
          >
            <Square className="h-3 w-3" />
          </button>
          <button
            onClick={playbackState === 'playing' ? pause : play}
            className="h-9 w-9 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all active:scale-95"
          >
            <AnimatePresence mode="wait">
              {playbackState === 'playing' ? (
                <motion.div key="pause" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Pause className="h-3.5 w-3.5" />
                </motion.div>
              ) : (
                <motion.div key="play" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Play className="h-3.5 w-3.5 ml-0.5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
          <div className="w-7" />
        </div>

        {/* Volume - only in expanded mode */}
        <div className="hidden sm:flex items-center gap-1.5 flex-1 justify-end max-w-[120px]">
          <button
            onClick={() => setVolume(volume > 0 ? 0 : 0.75)}
            className="text-white/50 hover:text-white transition-colors shrink-0"
          >
            {volume === 0 ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  )
}
