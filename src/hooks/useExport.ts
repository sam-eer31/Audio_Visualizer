import { useCallback } from 'react'
import { useExportStore } from '@/stores/exportStore'
import { useAudioStore } from '@/stores/audioStore'
import { RESOLUTION_MAP } from '@/types'
import { useUIStore } from '@/stores/uiStore'

export function useExport() {
  const { resolution, quality, frameRate, setIsExporting, setProgress, setError } = useExportStore()
  const { audioElement, audioDestination } = useAudioStore()
  const addToast = useUIStore((s) => s.addToast)

  const startExport = useCallback(async () => {
    const canvas = document.querySelector('canvas')
    if (!canvas) {
      addToast('No visualization canvas found', 'error')
      return
    }

    if (!audioElement || !audioDestination) {
      addToast('Please load and play audio first', 'error')
      return
    }

    try {
      setIsExporting(true)
      setProgress(0)
      setError(null)

      const { width, height } = RESOLUTION_MAP[resolution]
      const qualityMap = { low: 2_500_000, medium: 5_000_000, high: 10_000_000 }
      const bitrate = qualityMap[quality]

      // Create offscreen canvas for export at target resolution
      const offscreen = document.createElement('canvas')
      offscreen.width = width
      offscreen.height = height

      const videoStream = canvas.captureStream(frameRate)
      const audioTracks = audioDestination.stream.getAudioTracks()

      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioTracks,
      ])

      // Determine supported MIME type
      let mimeType = 'video/webm;codecs=vp9,opus'
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2')) {
        mimeType = 'video/mp4;codecs=avc1,mp4a.40.2'
      } else if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus'
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm'
        }
      }

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: bitrate,
      })

      const chunks: Blob[] = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      const duration = audioElement.duration - audioElement.currentTime
      const startTime = Date.now()

      recorder.onstop = () => {
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
        const blob = new Blob(chunks, { type: mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audio-visualizer-${Date.now()}.${ext}`
        a.click()
        URL.revokeObjectURL(url)

        setIsExporting(false)
        setProgress(100)
        addToast(`Export complete! Saved as ${ext.toUpperCase()}`, 'success')
      }

      recorder.onerror = () => {
        setIsExporting(false)
        setError('Export failed')
        addToast('Export failed. Please try again.', 'error')
      }

      // Restart audio from current position for recording
      audioElement.currentTime = 0
      await audioElement.play()
      recorder.start(100) // Collect data every 100ms

      // Progress tracking
      const progressInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000
        const progress = Math.min((elapsed / duration) * 100, 99)
        setProgress(progress)
      }, 200)

      // Stop when audio ends
      const onEnded = () => {
        clearInterval(progressInterval)
        recorder.stop()
        audioElement.removeEventListener('ended', onEnded)
      }
      audioElement.addEventListener('ended', onEnded)

      // Safety timeout
      setTimeout(() => {
        if (recorder.state === 'recording') {
          clearInterval(progressInterval)
          recorder.stop()
          audioElement.pause()
        }
      }, (duration + 2) * 1000)
    } catch (err) {
      setIsExporting(false)
      setError(err instanceof Error ? err.message : 'Export failed')
      addToast('Export failed: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error')
    }
  }, [resolution, quality, frameRate, audioElement, audioDestination, setIsExporting, setProgress, setError, addToast])

  return { startExport }
}
