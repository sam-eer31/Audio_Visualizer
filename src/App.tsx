import { useCallback } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { useAudioControls } from '@/hooks/useAudioControls'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useUIStore } from '@/stores/uiStore'

export default function App() {
  const { playbackState, play, pause, stop } = useAudioControls()
  const { setExpanded, expanded } = useUIStore()

  const handlePlayPause = useCallback(() => {
    if (playbackState === 'playing') pause()
    else play()
  }, [playbackState, play, pause])

  const handleReset = useCallback(() => { stop() }, [stop])

  const handleFullscreen = useCallback(() => {
    setExpanded(!expanded)
  }, [expanded, setExpanded])

  const handleExport = useCallback(() => {
    // no-op: export is always visible
  }, [])

  useKeyboardShortcuts({
    onPlayPause: handlePlayPause,
    onReset: handleReset,
    onFullscreen: handleFullscreen,
    onExport: handleExport,
  })

  return <AppLayout />
}
