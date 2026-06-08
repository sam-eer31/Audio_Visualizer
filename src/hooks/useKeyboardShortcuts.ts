import { useEffect } from 'react'

interface ShortcutHandlers {
  onPlayPause: () => void
  onReset: () => void
  onFullscreen: () => void
  onExport: () => void
}

export function useKeyboardShortcuts({ onPlayPause, onReset, onFullscreen, onExport }: ShortcutHandlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          onPlayPause()
          break
        case 'KeyR':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            onReset()
          }
          break
        case 'KeyF':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            onFullscreen()
          }
          break
        case 'KeyE':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            onExport()
          }
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onPlayPause, onReset, onFullscreen, onExport])
}
